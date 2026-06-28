import { prisma } from "@/lib/prisma";
import { Stage } from "@prisma/client";

export interface AnalysisSnapshot {
  crm: {
    totalContacts: number;
    contactsAddedToday: number;
    contactsArchivedToday: number;
    stageChangesToday: number;
    pipelineValue: number;
    pipelineValueAddedToday: number;
    conversionRate: number;
    averageDealSize: number;
  };
  tasks: {
    totalActiveTasks: number;
    tasksCreatedToday: number;
    tasksCompletedToday: number;
    tasksOverdue: number;
    plannedHours: number;
    outsideWorkdayTasks: number;
  };
  deepWork: {
    totalFocusTimeToday: number;
    numberOfSessions: number;
    longestSession: number;
    averageSession: number;
    currentStreak: number;
  };
  projects: {
    activeProjects: number;
    newProjectsToday: number;
    completedProjects: number;
  };
}

export class AnalysisProviders {
  static async getDailySnapshot(userId: string, date: Date): Promise<AnalysisSnapshot> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
    const now = new Date(); // Represents "current state"
    
    // --- 1. CRM ---
    const allContacts = await prisma.contact.findMany({
      where: { userId, isArchived: false }
    });
    const contactsCreatedToday = await prisma.contact.findMany({
      where: { userId, createdAt: { gte: startOfDay, lte: endOfDay } }
    });
    const contactsArchivedToday = await prisma.contact.count({
      where: { userId, isArchived: true, updatedAt: { gte: startOfDay, lte: endOfDay } }
    });
    const activitiesToday = await prisma.activity.findMany({
      where: { contact: { userId }, createdAt: { gte: startOfDay, lte: endOfDay } },
      include: { contact: true }
    });
    const stageChangesToday = activitiesToday.filter(a => a.type === "STAGE_CHANGE").length;

    const pipelineDeals = allContacts.filter(c => c.stage !== Stage.REJECTED);
    const pipelineValue = pipelineDeals.reduce((acc, c) => acc + Number(c.moneyValue), 0);
    
    const dealsCreatedToday = contactsCreatedToday.filter(c => c.stage !== Stage.REJECTED);
    const pipelineValueAddedToday = dealsCreatedToday.reduce((acc, c) => acc + Number(c.moneyValue), 0);

    const convertedDeals = allContacts.filter(c => c.stage === Stage.CUSTOMER);
    const conversionRate = allContacts.length > 0 ? (convertedDeals.length / allContacts.length) * 100 : 0;
    
    const validDeals = pipelineDeals.filter(c => Number(c.moneyValue) > 0);
    const averageDealSize = validDeals.length > 0 ? pipelineValue / validDeals.length : 0;

    // --- 2. Tasks ---
    const totalActiveTasks = await prisma.task.count({
      where: { userId, isCompleted: false }
    });
    const tasksCreatedToday = await prisma.task.count({
      where: { userId, createdAt: { gte: startOfDay, lte: endOfDay } }
    });
    
    const tasksCompletedTodayEntities = await prisma.task.findMany({
      where: { userId, isCompleted: true, completedAt: { gte: startOfDay, lte: endOfDay } }
    });
    const tasksCompletedToday = tasksCompletedTodayEntities.length;

    const tasksOverdue = await prisma.task.count({
      where: { userId, isCompleted: false, dueDate: { lt: startOfDay } }
    });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { workdayStart: true, workdayEnd: true } });
    const workdayStartStr = user?.workdayStart || "09:00";
    const workdayEndStr = user?.workdayEnd || "18:00";
    
    // Calculate outside workday tasks based on completion time if completed today
    let outsideWorkdayTasks = 0;
    for (const task of tasksCompletedTodayEntities) {
      if (task.completedAt) {
        const hour = task.completedAt.getHours();
        const minute = task.completedAt.getMinutes();
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        if (timeStr < workdayStartStr || timeStr > workdayEndStr) {
          outsideWorkdayTasks++;
        }
      }
    }

    // Planned hours based on estimated duration of tasks scheduled for today
    const tasksScheduledToday = await prisma.task.findMany({
      where: { userId, isCompleted: false, dueDate: { gte: startOfDay, lte: endOfDay } }
    });
    const plannedMinutes = tasksScheduledToday.reduce((acc, t) => acc + (t.estimatedDurationMinutes || 0), 0);
    const plannedHours = Math.round((plannedMinutes / 60) * 10) / 10;

    // --- 3. Deep Work ---
    const sessionsToday = await prisma.focusSession.findMany({
      where: { userId, startTime: { gte: startOfDay, lte: endOfDay } }
    });
    const totalFocusTimeToday = sessionsToday.reduce((acc, s) => acc + s.actualFocusDuration, 0);
    const numberOfSessions = sessionsToday.length;
    const longestSession = sessionsToday.length > 0 ? Math.max(...sessionsToday.map(s => s.actualFocusDuration)) : 0;
    const averageSession = sessionsToday.length > 0 ? Math.round(totalFocusTimeToday / sessionsToday.length) : 0;
    
    // Simplistic current streak calc (this usually needs historical aggregation, 
    // assuming if they worked today it adds to yesterday's, but for snapshot we rely on 
    // recent days).
    const recentSessions = await prisma.focusSession.findMany({
      where: { userId, startTime: { gte: new Date(date.getTime() - 14 * 24 * 60 * 60 * 1000) } },
      orderBy: { startTime: 'desc' }
    });
    
    const uniqueDays = new Set(recentSessions.map(s => s.startTime.toDateString()));
    let streak = 0;
    let checkDate = new Date(date);
    while (uniqueDays.has(checkDate.toDateString())) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    const currentStreak = streak;

    // --- 4. Projects ---
    const allProjects = await prisma.project.findMany({
      where: { userId },
      include: { tasks: true }
    });
    
    // A project is considered completed if it has tasks and ALL of them are completed
    let activeProjects = 0;
    let completedProjectsCount = 0;
    for (const proj of allProjects) {
      if (proj.tasks.length > 0) {
        if (proj.tasks.every(t => t.isCompleted)) {
          completedProjectsCount++;
        } else {
          activeProjects++;
        }
      } else {
        // Empty projects are active
        activeProjects++;
      }
    }

    const newProjectsToday = await prisma.project.count({
      where: { userId, createdAt: { gte: startOfDay, lte: endOfDay } }
    });

    return {
      crm: {
        totalContacts: allContacts.length,
        contactsAddedToday: contactsCreatedToday.length,
        contactsArchivedToday,
        stageChangesToday,
        pipelineValue,
        pipelineValueAddedToday,
        conversionRate,
        averageDealSize
      },
      tasks: {
        totalActiveTasks,
        tasksCreatedToday,
        tasksCompletedToday,
        tasksOverdue,
        plannedHours,
        outsideWorkdayTasks
      },
      deepWork: {
        totalFocusTimeToday,
        numberOfSessions,
        longestSession,
        averageSession,
        currentStreak
      },
      projects: {
        activeProjects,
        newProjectsToday,
        completedProjects: completedProjectsCount
      }
    };
  }
}
