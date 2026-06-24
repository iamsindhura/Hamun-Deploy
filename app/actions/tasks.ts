"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TaskPriority, TaskType } from "@prisma/client";

const SECTION_COLORS = ["purple", "blue", "emerald", "orange", "pink", "indigo", "teal", "rose"];

// Columns
export async function getColumns(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    let columns = await prisma.taskColumn.findMany({
      where: { projectId, project: { userId: session.user.id } },
      orderBy: { position: "asc" }
    });

    let needsUpdate = false;
    for (let i = 0; i < columns.length; i++) {
      if (!columns[i].color) {
        const assignedColor = SECTION_COLORS[i % SECTION_COLORS.length];
        await prisma.taskColumn.update({
          where: { id: columns[i].id },
          data: { color: assignedColor }
        });
        columns[i].color = assignedColor;
        needsUpdate = true;
      }
    }

    return { success: true, data: columns };
  } catch (error) {
    return { success: false, error: "Failed to fetch columns" };
  }
}

export async function createColumn(data: { name: string; position: number; projectId: string }) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const project = await prisma.project.findFirst({ where: { id: data.projectId, userId: session.user.id } });
    if (!project) throw new Error("Not found");
    
    const assignedColor = SECTION_COLORS[data.position % SECTION_COLORS.length];
    
    const column = await prisma.taskColumn.create({
      data: {
        name: data.name,
        position: data.position,
        projectId: data.projectId,
        color: assignedColor,
      }
    });
    revalidatePath(`/tasks/${data.projectId}`);
    return { success: true, data: column };
  } catch (error) {
    return { success: false, error: "Failed to create column" };
  }
}

export async function updateColumn(id: string, projectId: string, data: { name: string }) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const project = await prisma.project.findFirst({ where: { id: projectId, userId: session.user.id } });
    if (!project) throw new Error("Not found");
    const column = await prisma.taskColumn.update({
      where: { id },
      data: { name: data.name }
    });
    revalidatePath(`/tasks/${projectId}`);
    return { success: true, data: column };
  } catch (error) {
    return { success: false, error: "Failed to update column" };
  }
}

export async function deleteColumn(id: string, projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const project = await prisma.project.findFirst({ where: { id: projectId, userId: session.user.id } });
    if (!project) throw new Error("Not found");
    await prisma.taskColumn.delete({
      where: { id }
    });
    revalidatePath(`/tasks/${projectId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete column" };
  }
}

// Tasks
export async function getTasks(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const tasks = await prisma.task.findMany({
      where: { projectId, userId: session.user.id },
      include: { subtasks: true, contact: true },
      orderBy: { position: "asc" }
    });
    return { success: true, data: tasks };
  } catch (error) {
    return { success: false, error: "Failed to fetch tasks" };
  }
}

export async function checkTimeConflict(startTime: Date, endTime: Date, excludeTaskId?: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const conflict = await prisma.task.findFirst({
      where: {
        userId: session.user.id,
        isCompleted: false,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
        ...(excludeTaskId ? { id: { not: excludeTaskId } } : {})
      }
    });

    if (conflict) {
      const formatTime = (d: Date | null) => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      return { 
        success: false, 
        error: `⚠ Scheduling Conflict\nThis time slot overlaps with:\n${conflict.title}\n${formatTime(conflict.startTime)} - ${formatTime(conflict.endTime)}` 
      };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to check conflicts" };
  }
}

export async function createTask(data: { title: string; description?: string; columnId?: string; projectId: string; dueDate?: Date; priority?: TaskPriority; isPinned?: boolean; position: number; contactId?: string; startTime?: Date; endTime?: Date; taskType?: TaskType }) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    console.log("createTask called with:", { 
      taskType: data.taskType, 
      startTime: data.startTime, 
      endTime: data.endTime, 
      dueDate: data.dueDate 
    });

    if (data.startTime && data.endTime) {
      if (new Date(data.startTime) <= new Date()) {
        return { success: false, error: "Tasks can only be scheduled in the future." };
      }
      if (new Date(data.endTime) <= new Date(data.startTime)) {
        return { success: false, error: "End time must be after start time." };
      }



      const conflictResult = await checkTimeConflict(new Date(data.startTime), new Date(data.endTime));
      if (!conflictResult.success) {
        return { success: false, error: conflictResult.error };
      }
    }

    const task = await prisma.task.create({
      data: {
        ...data,
        userId: session.user.id
      }
    });
    revalidatePath(`/tasks/${data.projectId}`);
    return { success: true, data: task };
  } catch (error) {
    return { success: false, error: "Failed to create task" };
  }
}

export async function updateTask(id: string, projectId: string, data: Partial<any>) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    console.log("updateTask called with:", { 
      id,
      taskType: data.taskType, 
      startTime: data.startTime, 
      endTime: data.endTime, 
      dueDate: data.dueDate 
    });
    // If updating timeboxing, we need to check conflicts, but only if both times are provided or if we fetch the current task to compare.
    // For simplicity, if startTime or endTime is in data, we fetch the final times to validate.
    if (data.startTime !== undefined || data.endTime !== undefined) {
      const currentTask = await prisma.task.findUnique({ where: { id } });
      const finalStartTime = data.startTime !== undefined ? data.startTime : currentTask?.startTime;
      const finalEndTime = data.endTime !== undefined ? data.endTime : currentTask?.endTime;
      
      if (finalStartTime && finalEndTime) {
        if (new Date(finalStartTime) <= new Date()) {
          return { success: false, error: "Tasks can only be scheduled in the future." };
        }
        if (new Date(finalEndTime) <= new Date(finalStartTime)) {
          return { success: false, error: "End time must be after start time." };
        }



        const conflictResult = await checkTimeConflict(new Date(finalStartTime), new Date(finalEndTime), id);
        if (!conflictResult.success) {
          return { success: false, error: conflictResult.error };
        }
      }
    }

    if (data.isCompleted !== undefined) {
      data.completedAt = data.isCompleted ? new Date() : null;
    }

    const task = await prisma.task.update({
      where: { id, userId: session.user.id },
      data
    });
    revalidatePath(`/tasks/${projectId}`);
    revalidatePath(`/tasks/today`);
    revalidatePath(`/tasks/upcoming`);
    return { success: true, data: task };
  } catch (error) {
    return { success: false, error: "Failed to update task" };
  }
}

export async function deleteTask(id: string, projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    await prisma.task.delete({
      where: { id, userId: session.user.id }
    });
    revalidatePath(`/tasks/${projectId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete task" };
  }
}
// Subtasks
export async function createSubtask(data: { title: string; taskId: string; projectId: string; position: number }) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const subtask = await prisma.subtask.create({
      data: {
        title: data.title,
        taskId: data.taskId,
        position: data.position
      }
    });
    revalidatePath(`/tasks/${data.projectId}`);
    return { success: true, data: subtask };
  } catch (error) {
    return { success: false, error: "Failed to create subtask" };
  }
}

export async function updateSubtask(id: string, projectId: string, data: Partial<any>) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const subtask = await prisma.subtask.update({
      where: { id },
      data
    });
    revalidatePath(`/tasks/${projectId}`);
    return { success: true, data: subtask };
  } catch (error) {
    return { success: false, error: "Failed to update subtask" };
  }
}

export async function deleteSubtask(id: string, projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    await prisma.subtask.delete({
      where: { id }
    });
    revalidatePath(`/tasks/${projectId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete subtask" };
  }
}

export async function recoverOverdueTask(taskId: string, actionType: 'MOVE_TOMORROW' | 'MOVE_NEXT_FREE_SLOT') {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId, userId: session.user.id } });
    if (!task || !task.startTime || !task.endTime) return { success: false, error: "Task not found or missing time constraints" };

    // Use full 24-hour day
    const wsH = 0; const wsM = 0;
    const weH = 23; const weM = 59;

    const durationMs = task.endTime.getTime() - task.startTime.getTime();

    if (actionType === 'MOVE_TOMORROW') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const tomorrowStart = new Date(tomorrow);
      tomorrowStart.setHours(wsH, wsM, 0, 0);
      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(weH, weM, 59, 999);

      let targetStart = new Date(tomorrow);
      targetStart.setHours(task.startTime.getHours(), task.startTime.getMinutes(), 0, 0);
      let targetEnd = new Date(targetStart.getTime() + durationMs);

      if (targetStart.getTime() < tomorrowStart.getTime()) {
        targetStart = new Date(tomorrowStart);
        targetEnd = new Date(targetStart.getTime() + durationMs);
      }

      let canUseOriginalSlot = targetEnd.getTime() <= tomorrowEnd.getTime();

      if (canUseOriginalSlot) {
        const conflictCheck = await checkTimeConflict(targetStart, targetEnd, taskId);
        if (conflictCheck.success) {
          await prisma.task.update({
            where: { id: taskId },
            data: { startTime: targetStart, endTime: targetEnd, dueDate: targetStart }
          });
          revalidatePath(`/tasks/overdue`);
          revalidatePath(`/tasks/upcoming`);
          return { success: true };
        }
      }
      
      // If original slot is occupied or out of bounds, search for next free slot tomorrow
      const activeTasksTomorrow = await prisma.task.findMany({
          where: {
            userId: session.user.id,
            isCompleted: false,
            startTime: { gte: tomorrowStart, lt: tomorrowEnd },
            id: { not: taskId }
          },
          orderBy: { startTime: 'asc' }
        });

        let currentTestStart = new Date(Math.max(tomorrowStart.getTime(), targetStart.getTime()));
        let foundSlot = false;

        for (const t of activeTasksTomorrow) {
          if (!t.startTime || !t.endTime) continue;
          if (currentTestStart.getTime() + durationMs <= t.startTime.getTime()) {
            foundSlot = true;
            break;
          }
          currentTestStart = new Date(Math.max(currentTestStart.getTime(), t.endTime.getTime()));
        }

        if (!foundSlot && currentTestStart.getTime() + durationMs <= tomorrowEnd.getTime()) {
          foundSlot = true;
        }

        if (foundSlot) {
           await prisma.task.update({
             where: { id: taskId },
             data: { 
               startTime: currentTestStart, 
               endTime: new Date(currentTestStart.getTime() + durationMs),
               dueDate: currentTestStart
             }
           });
           revalidatePath(`/tasks/overdue`);
           revalidatePath(`/tasks/upcoming`);
           return { success: true };
        } else {
           return { success: false, error: "Tomorrow is completely booked. Please reschedule manually." };
        }
    } else if (actionType === 'MOVE_NEXT_FREE_SLOT') {
      const now = new Date();
      
      // Look up to 14 days ahead
      for (let dayOffset = 0; dayOffset <= 14; dayOffset++) {
        const testDate = new Date(now);
        testDate.setDate(testDate.getDate() + dayOffset);
        
        const dayStart = new Date(testDate);
        dayStart.setHours(wsH, wsM, 0, 0);
        
        const dayEnd = new Date(testDate);
        dayEnd.setHours(weH, weM, 59, 999);
        
        // If searching today, start from now if it's past workday start
        let searchStart = dayStart;
        if (dayOffset === 0) {
          searchStart = new Date(Math.max(now.getTime(), dayStart.getTime()));
          
          // If we are already past the end of the workday, skip today
          if (searchStart.getTime() + durationMs > dayEnd.getTime()) {
            continue;
          }
        }
        
        const activeTasks = await prisma.task.findMany({
          where: {
            userId: session.user.id,
            isCompleted: false,
            startTime: { gte: dayStart, lt: dayEnd },
            id: { not: taskId }
          },
          orderBy: { startTime: 'asc' }
        });

        let currentTestStart = new Date(searchStart);
        let foundSlot = false;

        for (const t of activeTasks) {
          if (!t.startTime || !t.endTime) continue;
          if (currentTestStart.getTime() + durationMs <= t.startTime.getTime()) {
            foundSlot = true;
            break;
          }
          currentTestStart = new Date(Math.max(currentTestStart.getTime(), t.endTime.getTime()));
        }

        if (!foundSlot && currentTestStart.getTime() + durationMs <= dayEnd.getTime()) {
          foundSlot = true;
        }

        if (foundSlot) {
           await prisma.task.update({
             where: { id: taskId },
             data: { 
               startTime: currentTestStart, 
               endTime: new Date(currentTestStart.getTime() + durationMs),
               dueDate: currentTestStart
             }
           });
           revalidatePath(`/tasks/overdue`);
           revalidatePath(`/tasks/upcoming`);
           revalidatePath(`/tasks/today`);
           return { success: true };
        }
      }
      
      return { success: false, error: "Unable to find a free slot. Please manually reschedule." };
    }
  } catch (error) {
    return { success: false, error: "Failed to recover task" };
  }
  
  return { success: false, error: "Invalid action" };
}

export async function scheduleUnscheduledTask(taskId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId, userId: session.user.id } });
    if (!task) return { success: false, error: "Task not found" };

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return { success: false, error: "User not found" };

    const [wsH, wsM] = user.workdayStart.split(':').map(Number);
    const [weH, weM] = user.workdayEnd.split(':').map(Number);

    const durationMins = task.estimatedDurationMinutes || 30;
    const durationMs = durationMins * 60 * 1000;

    const now = new Date();
    
    // Look up to 14 days ahead
    for (let dayOffset = 0; dayOffset <= 14; dayOffset++) {
      const testDate = new Date(now);
      testDate.setDate(testDate.getDate() + dayOffset);
      
      const dayStart = new Date(testDate);
      dayStart.setHours(wsH, wsM, 0, 0);
      
      const dayEnd = new Date(testDate);
      dayEnd.setHours(weH, weM, 59, 999);
      
      // If searching today, start from now if it's past workday start
      let searchStart = dayStart;
      if (dayOffset === 0) {
        searchStart = new Date(Math.max(now.getTime(), dayStart.getTime()));
        
        // If we are already past the end of the workday, skip today
        if (searchStart.getTime() + durationMs > dayEnd.getTime()) {
          continue;
        }
      }
      
      const activeTasks = await prisma.task.findMany({
        where: {
          userId: session.user.id,
          isCompleted: false,
          startTime: { gte: dayStart, lt: dayEnd },
          id: { not: taskId }
        },
        orderBy: { startTime: 'asc' }
      });

      let currentTestStart = new Date(searchStart);
      let foundSlot = false;

      for (const t of activeTasks) {
        if (!t.startTime || !t.endTime) continue;
        if (currentTestStart.getTime() + durationMs <= t.startTime.getTime()) {
          foundSlot = true;
          break;
        }
        currentTestStart = new Date(Math.max(currentTestStart.getTime(), t.endTime.getTime()));
      }

      if (!foundSlot && currentTestStart.getTime() + durationMs <= dayEnd.getTime()) {
        foundSlot = true;
      }

      if (foundSlot) {
         await prisma.task.update({
           where: { id: taskId },
           data: { 
             startTime: currentTestStart, 
             endTime: new Date(currentTestStart.getTime() + durationMs),
             dueDate: currentTestStart
           }
         });
         revalidatePath(`/tasks/today`);
         revalidatePath(`/tasks/upcoming`);
         revalidatePath(`/tasks/${task.projectId}`);
         return { success: true };
      }
    }
    
    return { success: false, error: "Unable to find a free slot. Please manually reschedule." };
  } catch (error) {
    return { success: false, error: "Failed to schedule task" };
  }
}

