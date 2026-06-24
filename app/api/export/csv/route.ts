import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
 const session = await auth();
 if (!session?.user?.id) {
 return new NextResponse("Unauthorized", { status: 401 });
 }

 const contacts = await prisma.contact.findMany({
 where: { userId: session.user.id },
 orderBy: { createdAt: "desc" },
 });

 const headers = [
 "ID",
 "Name",
 "Stage",
 "Phone",
 "Email",
 "Money Value",
 "Priority",
 "Tags",
 "Source",
 "Follow Up Count",
 "Last Contacted At",
 "Created At",
 ].join(",");

 const rows = contacts.map((c) => {
 return [
 c.id,
 `"${c.name.replace(/"/g, '""')}"`,
 c.stage,
 c.phone || "",
 c.email || "",
 Number(c.moneyValue),
 c.priority,
 `"${c.tags.join(";").replace(/"/g, '""')}"`,
 c.source || "",
 c.followUpCount,
 c.lastContactedAt ? c.lastContactedAt.toISOString() : "",
 c.createdAt.toISOString(),
 ].join(",");
 });

 const csv = [headers, ...rows].join("\n");

 return new NextResponse(csv, {
 headers: {
 "Content-Type": "text/csv",
 "Content-Disposition": `attachment; filename="contacts-export-${new Date().toISOString().split("T")[0]}.csv"`,
 },
 });
}
