import { prisma } from "@/lib/prisma";

export interface DailyContext {
  raw: {
    contactsCreated: number;
    tasksCreated: number;
    tasksCompleted: number;
    overdueTasks: number;
    projectsCreated: number;
    crmActivities: number;
    pipelineMoves: number;
    totalFocusMinutes: number;
    focusSessionsCount: number;
  };
  semantics: {
    productivitySummary: string;
    relationshipSummary: string;
    focusSummary: string;
    workloadSummary: string;
    consistencySummary: string;
    highLevelNarrative: string;
  };
  predictedEmotion: string;
}

export class DailyContextBuilder {
  static async buildContext(userId: string, date: Date): Promise<DailyContext> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

    // 1. Fetch CRM Data
    const contactsCreated = await prisma.contact.count({
      where: { userId, createdAt: { gte: startOfDay, lte: endOfDay } }
    });
    
    const activities = await prisma.activity.findMany({
      where: { contact: { userId }, createdAt: { gte: startOfDay, lte: endOfDay } },
      include: { contact: true }
    });

    const pipelineMoves = activities.filter(a => a.type === "STAGE_CHANGE").length;

    // 2. Fetch Tasks Data
    const tasksCreated = await prisma.task.count({
      where: { userId, createdAt: { gte: startOfDay, lte: endOfDay } }
    });
    const tasksCompleted = await prisma.task.count({
      where: { userId, completedAt: { gte: startOfDay, lte: endOfDay } }
    });
    const overdueTasks = await prisma.task.count({
      where: { userId, dueDate: { lt: startOfDay }, isCompleted: false }
    });

    // 3. Fetch Projects Data
    const projectsCreated = await prisma.project.count({
      where: { userId, createdAt: { gte: startOfDay, lte: endOfDay } }
    });

    // 4. Fetch Deep Work Data
    const focusSessions = await prisma.focusSession.findMany({
      where: { userId, startTime: { gte: startOfDay, lte: endOfDay } }
    });
    const totalFocusMinutes = focusSessions.reduce((acc, s) => acc + s.actualFocusDuration, 0);
    const focusSessionsCount = focusSessions.length;

    // --- Build Semantics ---
    
    let productivitySummary = "The day felt quiet, with space left open for planning rather than heavy execution.";
    if (tasksCompleted > 10) {
      productivitySummary = "A highly productive day where significant momentum was built and many loops were closed.";
    } else if (tasksCompleted > 3) {
      productivitySummary = "The day maintained a steady rhythm with consistent, meaningful progress.";
    }

    let relationshipSummary = "There wasn't much external interaction, keeping the focus mostly internal.";
    if (contactsCreated > 2 || activities.length > 5) {
      relationshipSummary = "The professional network expanded, and valuable connections were nurtured today.";
    } else if (pipelineMoves > 0) {
      relationshipSummary = "Professional efforts actively moved things forward and strengthened business relationships.";
    }

    let focusSummary = "Today leaned more toward organization and light tasks rather than uninterrupted deep work.";
    if (totalFocusMinutes > 180) {
      focusSummary = "An incredible state of flow was achieved with deep, uninterrupted blocks of focus.";
    } else if (totalFocusMinutes > 60) {
      focusSummary = "Solid blocks of concentration allowed for meaningful, undistracted work.";
    }

    let workloadSummary = "The current workload feels highly manageable and clear.";
    if (overdueTasks > 10) {
      workloadSummary = "There is a noticeable backlog creating some pressure, calling for a gentle reset and reprioritization.";
    } else if (overdueTasks > 3) {
      workloadSummary = "A few older items are lingering, but nothing that cannot be handled with a little dedicated time.";
    }

    let consistencySummary = "A day of steady baseline effort.";
    if (tasksCompleted > 5 && totalFocusMinutes > 60) {
      consistencySummary = "A perfectly balanced day showing great harmony between deep focus and knocking out tasks.";
    }

    let highLevelNarrative = "Today was about finding balance and maintaining quiet progress.";
    
    // --- Predict Emotion ---
    let predictedEmotion = "Neutral";
    
    if (totalFocusMinutes > 120 && tasksCompleted > 5) {
      predictedEmotion = "Motivated";
    } else if (overdueTasks > 10 && tasksCompleted < 2) {
      predictedEmotion = "Stressed";
    } else if (contactsCreated > 3 || pipelineMoves > 2) {
      predictedEmotion = "Excited";
    } else if (totalFocusMinutes === 0 && tasksCompleted === 0) {
      predictedEmotion = "Reflective";
    } else if (totalFocusMinutes > 60) {
      predictedEmotion = "Focused";
    } else if (tasksCompleted > 3) {
      predictedEmotion = "Good";
    }

    return {
      raw: {
        contactsCreated,
        tasksCreated,
        tasksCompleted,
        overdueTasks,
        projectsCreated,
        crmActivities: activities.length,
        pipelineMoves,
        totalFocusMinutes,
        focusSessionsCount
      },
      semantics: {
        productivitySummary,
        relationshipSummary,
        focusSummary,
        workloadSummary,
        consistencySummary,
        highLevelNarrative
      },
      predictedEmotion
    };
  }
}
