"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";

interface TaskReminderContextType {
  setGlobalTasks: (tasks: any[]) => void;
}

const TaskReminderContext = createContext<TaskReminderContextType>({
  setGlobalTasks: () => {},
});

export function useTaskReminders() {
  return useContext(TaskReminderContext);
}

// Temporary debug option - easily changeable
const REMINDER_MINUTES = 5;

export function TaskReminderProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const notifiedTasks = useRef<Set<string>>(new Set());
  const permissionRequested = useRef(false);

  // 1. VERIFY BROWSER NOTIFICATION PERMISSIONS
  useEffect(() => {
    if (!("Notification" in window)) return;

    console.log("Notification Permission:", Notification.permission);

    if (Notification.permission === "denied") {
      console.warn("Notifications are denied by the user. Task reminders will not work.");
    }

    if (!permissionRequested.current && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        console.log("Notification Permission Updated To:", permission);
      });
      permissionRequested.current = true;
    }

    // 2. ADD TEST NOTIFICATION FUNCTION
    (window as any).testNotification = () => {
      new Notification("HAMUN Test", {
        body: "Notifications are working."
      });
      console.log("Test notification fired.");
    };
  }, []);

  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    const checkReminders = () => {
      if (!("Notification" in window) || Notification.permission !== "granted") return;

      console.log("Checking reminders...");
      const now = new Date();
      
      tasks.forEach((task) => {
        if (task.isCompleted) return;

        // Upcoming Check
        if (task.startTime) {
          const start = new Date(task.startTime);
          const minutesUntilStart = (start.getTime() - now.getTime()) / 60000;

          if (minutesUntilStart <= 5 && minutesUntilStart >= 0) {
            const key = task.id + "-upcoming";
            if (!notifiedTasks.current.has(key)) {
              console.log("Task start time reached notification:", task.title);
              notifiedTasks.current.add(key);
              
              new Notification("⏰ Upcoming Task", {
                body: `${task.title}\nStarts in ${Math.ceil(minutesUntilStart)} minutes.`,
              });
            }
          }
        }

        // Overdue Check
        if (task.endTime) {
          const end = new Date(task.endTime);
          const minutesUntilEnd = (end.getTime() - now.getTime()) / 60000;

          if (minutesUntilEnd < 0 && minutesUntilEnd >= -1) { // Only fire if it just became overdue
            const key = task.id + "-overdue";
            if (!notifiedTasks.current.has(key)) {
              console.log("Task overdue notification:", task.title);
              notifiedTasks.current.add(key);
              
              new Notification("🚨 Task Overdue", {
                body: `${task.title}\nThis task is now overdue.`,
              });
            }
          }
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 15000);
    
    return () => clearInterval(interval);
  }, [tasks]);

  return (
    <TaskReminderContext.Provider value={{ setGlobalTasks: setTasks }}>
      {/* TEMPORARY TEST BUTTON (Dev Only) */}
      {process.env.NODE_ENV === "development" && (
        <button 
          onClick={() => (window as any).testNotification?.()}
          className="fixed bottom-4 right-4 z-50 bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold hover:bg-slate-700 opacity-50 hover:opacity-100 transition-opacity"
        >
          Test Notification
        </button>
      )}
      {children}
    </TaskReminderContext.Provider>
  );
}
