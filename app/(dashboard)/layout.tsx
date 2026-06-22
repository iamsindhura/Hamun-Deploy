import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ResponsiveLayout } from "@/components/layout/responsive-layout";
import { AutoFollowUpTrigger } from "@/components/contacts/auto-followup-trigger";
import { TaskReminderProvider } from "@/components/providers/task-reminder-provider";

import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: [
      { isPinned: "desc" },
      { position: "asc" },
      { createdAt: "asc" }
    ]
  });

  const serializedProjects = projects.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <ResponsiveLayout projects={serializedProjects}>
      <TaskReminderProvider>
        <AutoFollowUpTrigger />
        {children}
      </TaskReminderProvider>
    </ResponsiveLayout>
  );
}
