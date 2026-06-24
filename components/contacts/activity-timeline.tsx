"use client";

import { formatDistanceToNow } from "date-fns";
import { 
 MessageSquare, 
 Phone, 
 Mail, 
 Calendar, 
 RefreshCw, 
 Settings,
 User,
 Plus
} from "lucide-react";
import { ActivityType } from "@prisma/client";
import { cn } from "@/lib/utils";

interface Activity {
 id: string;
 type: ActivityType;
 content: string;
 createdAt: Date;
}

interface ActivityTimelineProps {
 activities: Activity[];
}

const activityConfig = {
 [ActivityType.NOTE]: {
 icon: MessageSquare,
 color: "text-blue-500",
 bg: "bg-blue-50 dark:bg-blue-950/30",
 border: "border-blue-100 dark:border-blue-900/30",
 },
 [ActivityType.CALL]: {
 icon: Phone,
 color: "text-green-500",
 bg: "bg-green-50 dark:bg-green-950/30",
 border: "border-green-100 dark:border-green-900/30",
 },
 [ActivityType.EMAIL]: {
 icon: Mail,
 color: "text-purple-500",
 bg: "bg-purple-50 dark:bg-purple-950/30",
 border: "border-purple-100 dark:border-purple-900/30",
 },
 [ActivityType.MEETING]: {
 icon: Calendar,
 color: "text-orange-500",
 bg: "bg-orange-50 dark:bg-orange-950/30",
 border: "border-orange-100 dark:border-orange-900/30",
 },
 [ActivityType.STAGE_CHANGE]: {
 icon: RefreshCw,
 color: "text-amber-500",
 bg: "bg-amber-50 dark:bg-amber-950/30",
 border: "border-amber-100 dark:border-amber-900/30",
 },
 [ActivityType.SYSTEM]: {
 icon: Settings,
 color: "text-slate-500",
 bg: "bg-slate-50 dark:bg-slate-900/30",
 border: "border-slate-100 dark:border-slate-800",
 },
};

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
 if (activities.length === 0) {
 return (
 <div className="flex flex-col items-center justify-center py-12 text-center">
 <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-4">
 <AlignLeft className="w-6 h-6 text-slate-300" />
 </div>
 <p className="text-sm text-slate-500 dark:text-slate-400">No activities logged yet.</p>
 </div>
 );
 }

 return (
 <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent dark:before:from-slate-800 dark:before:via-slate-800 pb-8">
 {activities.map((activity, index) => {
 const config = activityConfig[activity.type] || activityConfig[ActivityType.SYSTEM];
 const Icon = config.icon;

 return (
 <div key={activity.id} className="relative flex items-start gap-4 group">
 {/* Timeline Icon */}
 <div className={cn(
 "relative z-10 flex items-center justify-center w-10 h-10 rounded-xl border shadow-sm shrink-0 transition-transform group-hover:scale-110",
 config.bg,
 config.border,
 config.color
 )}>
 <Icon className="w-5 h-5" />
 </div>

 {/* Content */}
 <div className="flex-1 pt-1">
 <div className="flex items-center justify-between gap-2 mb-1">
 <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
 {activity.type.replace("_", " ")}
 </span>
 <span className="text-xs text-slate-400">
 {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
 </span>
 </div>
 <div className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm group-hover:border-purple-200 dark:group-hover:border-purple-900/30 transition-colors">
 {activity.content}
 </div>
 </div>
 </div>
 );
 })}
 </div>
 );
}

// Missing import fix
import { AlignLeft } from "lucide-react";
