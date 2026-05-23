import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";

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

  const workspaces = await prisma.workspace.findMany({
    where: { userId: session.user.id },
    include: { projects: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "asc" }
  });

  const serializedWorkspaces = workspaces.map(ws => ({
    ...ws,
    createdAt: ws.createdAt.toISOString(),
    updatedAt: ws.updatedAt.toISOString(),
    projects: ws.projects.map(p => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }))
  }));

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar workspaces={serializedWorkspaces} />
      <main className="flex-1 overflow-y-auto bg-white">
        {children}
      </main>
    </div>
  );
}
