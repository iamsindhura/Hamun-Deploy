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
  calculatedScores?: {
    taskScore: number;
    deepWorkScore: number;
    timeManagementScore: number;
    crmScore: number;
    habitScore: number;
    reflectionScore: number;
    overallScore: number;
  };
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

    // 5. Fetch Habit and Timeboxing specific data for score calculation
    // Habits are Tasks with taskType = HABIT.
    const habitsTotal = await prisma.task.count({
      where: { userId, taskType: "HABIT", createdAt: { gte: startOfDay, lte: endOfDay } }
    });
    const habitsCompleted = await prisma.task.count({
      where: { userId, taskType: "HABIT", completedAt: { gte: startOfDay, lte: endOfDay } }
    });

    // Timeboxing tasks are Tasks with startTime and endTime defined.
    const timeboxTotal = await prisma.task.count({
      where: { userId, startTime: { not: null }, endTime: { not: null }, createdAt: { gte: startOfDay, lte: endOfDay } }
    });
    const timeboxCompleted = await prisma.task.count({
      where: { userId, startTime: { not: null }, endTime: { not: null }, completedAt: { gte: startOfDay, lte: endOfDay } }
    });

    // --- Deterministic Scoring Engine ---
    // Task Score: (tasksCompleted / max(tasksCreated, 1)) * 100. If no tasks created, default to 50 if reflection/journal exists (handled under reflection).
    // Or simpler: base it on tasks Completed vs Tasks Created today. Let's make it robust:
    // If no tasks created, but tasks completed > 0 (e.g. from backlog), score is 100. If both 0, default to 50 (neutral base).
    let taskScore = 50;
    if (tasksCreated > 0) {
      taskScore = Math.round((tasksCompleted / tasksCreated) * 100);
    } else if (tasksCompleted > 0) {
      taskScore = 100;
    }
    taskScore = Math.max(0, Math.min(100, taskScore));

    // Deep Work Score: 1 session and 45 minutes of focus counts as solid (70 points).
    // Let's scale: totalFocusMinutes / 90 * 100. Cap at 100. If 0 focus sessions, score is 20.
    let deepWorkScore = 20;
    if (focusSessionsCount > 0 && totalFocusMinutes > 0) {
      deepWorkScore = Math.min(100, Math.round((totalFocusMinutes / 90) * 100));
      // Ensure we reward at least 40 if they did a focus block
      deepWorkScore = Math.max(40, deepWorkScore);
    }

    // Time Management Score: Based on timebox adherence.
    // If no timeboxes created, default to 60 (steady default).
    let timeManagementScore = 60;
    if (timeboxTotal > 0) {
      timeManagementScore = Math.round((timeboxCompleted / timeboxTotal) * 100);
    }

    // CRM Score: Based on pipeline moves and CRM activities.
    // Scale: (pipelineMoves * 40) + (activities.length * 10). Cap at 100. If 0 moves/activities, score is 30.
    let crmScore = 30;
    if (pipelineMoves > 0 || activities.length > 0) {
      crmScore = Math.min(100, (pipelineMoves * 50) + (activities.length * 15));
      crmScore = Math.max(40, crmScore);
    }

    // Habit Score: Completed habits vs total habits today.
    // If no habits created, default to 70 (balanced consistency default).
    let habitScore = 70;
    if (habitsTotal > 0) {
      habitScore = Math.round((habitsCompleted / habitsTotal) * 100);
    }

    // Reflection Score: Journal writing completion itself.
    // Since this context building occurs for today, completing the journal is a strong reflection act (90 points base).
    // Default to 85.
    const reflectionScore = 85;

    // Overall Score Calculation:
    // Tasks: 30%, Deep Work: 20%, Timeboxing: 15%, CRM: 15%, Habits: 10%, Reflection: 10%
    const rawOverallScore = (taskScore * 0.30) +
                            (deepWorkScore * 0.20) +
                            (timeManagementScore * 0.15) +
                            (crmScore * 0.15) +
                            (habitScore * 0.10) +
                            (reflectionScore * 0.10);
    const overallScore = Math.max(20, Math.min(100, Math.round(rawOverallScore)));

    const calculatedScores = {
      taskScore,
      deepWorkScore,
      timeManagementScore,
      crmScore,
      habitScore,
      reflectionScore,
      overallScore
    };

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
      calculatedScores,
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

