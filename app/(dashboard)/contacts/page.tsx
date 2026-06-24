import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ContactsView } from "@/components/contacts/contacts-view";

export default async function ContactsPage(props: { searchParams: Promise<{ tag?: string }> }) {
 const searchParams = await props.searchParams;
 const tag = searchParams?.tag;
 const session = await auth();
 
 if (!session?.user?.id) {
 return <div>Unauthorized</div>;
 }

 const whereClause: any = {
 userId: session.user.id,
 };
 if (tag) {
 whereClause.tags = { has: tag };
 }

 const contacts = await prisma.contact.findMany({
 where: whereClause,
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

 // Map Decimal to Number and compute overall last updated date
 const serializedContacts = contacts.map(c => {
 const lastActivityDate = c.activities[0]?.createdAt;
 const lastUpdated = lastActivityDate 
 ? new Date(Math.max(new Date(c.updatedAt).getTime(), new Date(lastActivityDate).getTime()))
 : c.updatedAt;

 return {
 ...c,
 moneyValue: Number(c.moneyValue),
 lastUpdated,
 };
 });

 return (
 <div className="flex-1 space-y-4 p-8 pt-6">
 <ContactsView initialData={serializedContacts} />
 </div>
 );
}
