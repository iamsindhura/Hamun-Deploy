import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TaskListView } from "@/components/tasks/task-list-view";
import { WorkdaySettingsCard } from "@/components/tasks/workday-settings-card";
import { Calendar } from "lucide-react";

export default async function TodayTasksPage() {
 const session = await auth();

 if (!session?.user) {
 redirect("/login");
 }

 const dbUser = await prisma.user.findUnique({
 where: { id: session.user.id },
 select: { workdayStart: true, workdayEnd: true }
 });
 const workdayStart = dbUser?.workdayStart || "09:00";
 const workdayEnd = dbUser?.workdayEnd || "18:00";

 const today = new Date();
 today.setHours(0, 0, 0, 0);
 const tomorrow = new Date(today);
 tomorrow.setDate(tomorrow.getDate() + 1);

 // METRIC 1: COMPLETED TODAY
 const completedTodayCount = await prisma.task.count({
 where: {
 userId: session.user.id,
 isCompleted: true,
 completedAt: {
 gte: today,
 lt: tomorrow
 }
 }
 });

 // METRIC 2: SCHEDULED TODAY
 const scheduledTodayCount = await prisma.task.count({
 where: {
 userId: session.user.id,
 startTime: {
 gte: today,
 lt: tomorrow
 }
 }
 });

 // METRIC 3: PLANNED HOURS
 const tasksScheduledToday = await prisma.task.findMany({
 where: {
 userId: session.user.id,
 startTime: { gte: today, lt: tomorrow },
 endTime: { not: null }
 },
 select: { startTime: true, endTime: true }
 });
 
 let plannedMinutes = 0;
 for (const t of tasksScheduledToday) {
 if (t.startTime && t.endTime) {
 plannedMinutes += Math.max(0, (t.endTime.getTime() - t.startTime.getTime()) / (1000 * 60));
 }
 }
 const hours = Math.floor(plannedMinutes / 60);
 const mins = Math.floor(plannedMinutes % 60);
 const plannedHoursDisplay = hours > 0 && mins > 0 ? `${hours}h ${mins}m` : hours > 0 ? `${hours}h` : `${mins}m`;

 // METRIC 4: OUTSIDE WORKDAY
 let outsideWorkdayCount = 0;
 for (const t of tasksScheduledToday) {
 if (t.startTime && t.endTime) {
 const startH = t.startTime.getHours();
 const startM = t.startTime.getMinutes();
 const endH = t.endTime.getHours();
 const endM = t.endTime.getMinutes();
 
 const [wsH, wsM] = workdayStart.split(':').map(Number);
 const [weH, weM] = workdayEnd.split(':').map(Number);
 
 const startMins = startH * 60 + startM;
 const endMins = endH * 60 + endM;
 const wsMins = wsH * 60 + wsM;
 const weMins = weH * 60 + weM;
 
 const crossesMidnight = endMins <= startMins;
 
 if (startMins < wsMins || endMins > weMins || crossesMidnight) {
 outsideWorkdayCount++;
 }
 }
 }

 // METRIC 5: TOTAL OVERDUES
 const overdueCount = await prisma.task.count({
 where: {
 userId: session.user.id,
 isCompleted: false,
 endTime: {
 lt: new Date()
 }
 }
 });

 // FETCH TASKS FOR LIST VIEW
 const tasks = await prisma.task.findMany({
 where: {
 userId: session.user.id,
 isCompleted: false,
 startTime: {
 gte: today,
 lt: tomorrow,
 },
 endTime: { gte: new Date() }
 },
 include: {
 project: true,
 },
 orderBy: { startTime: "asc" },
 });

 // FETCH UNSCHEDULED TASKS
 const unscheduledTasks = await prisma.task.findMany({
 where: {
 userId: session.user.id,
 isCompleted: false,
 startTime: null,
 endTime: null,
 },
 include: {
 project: true,
 },
 orderBy: { createdAt: "asc" },
 });

 console.log("Unscheduled Tasks count:", unscheduledTasks.length);
 console.log("Unscheduled Tasks data:", unscheduledTasks);

 return (
 <div className="flex h-full flex-col bg-background">
 <div className="flex h-16 items-center border-b border-border bg-card px-8 shrink-0">
 <h1 className="text-xl font-bold flex items-center gap-3 text-foreground">Today</h1>
 </div>
 <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
 {/* DASHBOARD METRICS */}
 <div className="mb-8 grid gap-4 grid-cols-2 md:grid-cols-6">
 {/* CARD 1: COMPLETED TODAY */}
 <div className="rounded-2xl border border-border border-l-[4px] border-l-[#8B5CF6] bg-card hover:bg-muted p-5 shadow-sm flex flex-col justify-between gap-3 min-h-[100px] transition-all hover:shadow-lg hover:-translate-y-1">
 <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Completed Today</span>
 <span className="text-4xl font-black text-foreground tracking-tight leading-none">{completedTodayCount}</span>
 </div>

 {/* CARD 2: SCHEDULED TODAY */}
 <div className="rounded-2xl border border-border border-l-[4px] border-l-[#3B82F6] bg-card hover:bg-muted p-5 shadow-sm flex flex-col justify-between gap-3 min-h-[100px] transition-all hover:shadow-lg hover:-translate-y-1">
 <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scheduled Today</span>
 <span className="text-4xl font-black text-foreground tracking-tight leading-none">{scheduledTodayCount}</span>
 </div>

 {/* CARD 3: PLANNED HOURS */}
 <div className="rounded-2xl border border-border border-l-[4px] border-l-[#22C55E] bg-card hover:bg-muted p-5 shadow-sm flex flex-col justify-between gap-3 min-h-[100px] transition-all hover:shadow-lg hover:-translate-y-1">
 <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Planned Hours</span>
 <span className="text-4xl font-black text-foreground tracking-tight leading-none">{plannedHoursDisplay || "0m"}</span>
 </div>

 {/* CARD 4: OUTSIDE WORKDAY */}
 <div className="rounded-2xl border border-border border-l-[4px] border-l-[#FACC15] bg-card hover:bg-muted p-5 shadow-sm flex flex-col justify-between gap-3 min-h-[100px] transition-all hover:shadow-lg hover:-translate-y-1">
 <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outside Workday</span>
 <span className="text-4xl font-black text-foreground tracking-tight leading-none">{outsideWorkdayCount}</span>
 </div>

 {/* CARD 5: TOTAL OVERDUES */}
 <div className="rounded-2xl border border-border border-l-[4px] border-l-[#EF4444] bg-card hover:bg-muted p-5 shadow-sm flex flex-col justify-between gap-3 min-h-[100px] transition-all hover:shadow-lg hover:-translate-y-1">
 <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Overdues</span>
 <span className="text-4xl font-black text-foreground tracking-tight leading-none">{overdueCount}</span>
 </div>

 {/* CARD 6: WORKDAY SETTINGS */}
 <WorkdaySettingsCard initialStart={workdayStart} initialEnd={workdayEnd} />
 </div>

 {tasks.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-3xl border border-border shadow-sm mb-8 relative overflow-hidden group">
 <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/5 to-transparent pointer-events-none"></div>
 <div className="rounded-full bg-muted border border-border p-8 mb-6 shadow-[0_0_30px_rgba(139,92,246,0.15)] group-hover:shadow-[0_0_40px_rgba(139,92,246,0.25)] transition-shadow duration-500">
 <Calendar className="h-12 w-12 text-[#8B5CF6]" />
 </div>
 <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight">No tasks scheduled for today</h3>
 <p className="text-muted-foreground font-medium max-w-md text-sm leading-relaxed">Take a break or schedule new tasks from your projects to keep the momentum going.</p>
 </div>
 ) : (
 <div className="mb-8">
 <TaskListView tasks={tasks} workdayStart={workdayStart} workdayEnd={workdayEnd} />
 </div>
 )}

 {unscheduledTasks.length > 0 && (
 <div className="mt-12">
 <div className="flex items-center gap-3 mb-6 px-1">
 <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">📌 Unscheduled Tasks</h2>
 <div className="h-px flex-1 bg-border"></div>
 </div>
 <TaskListView tasks={unscheduledTasks} variant="unscheduled" workdayStart={workdayStart} workdayEnd={workdayEnd} />
 </div>
 )}
 </div>
 </div>
 );
}