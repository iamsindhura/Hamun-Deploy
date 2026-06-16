import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { KanbanBoard } from "@/components/contacts/kanban-board";

export default async function KanbanPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return <div>Unauthorized</div>;
  }

  const contacts = await prisma.contact.findMany({
    where: {
      userId: session.user.id,
      isArchived: false,
    },
    include: {
      activities: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Serialize Decimal to Number
  const serializedContacts = contacts.map((c) => ({
    ...c,
    moneyValue: Number(c.moneyValue),
  }));

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Pipeline</h2>
      </div>
      <div className="flex-1 overflow-hidden">
        <KanbanBoard initialData={serializedContacts} />
      </div>
    </div>
  );
}
