import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const journals = await prisma.journal.findMany({
    orderBy: { date: 'desc' },
    take: 1
  });
  
  if (!journals.length) {
    return NextResponse.json({ error: "No journals" });
  }
  
  const j = journals[0];
  
  return NextResponse.json({
    id: j.id,
    insights: j.insights
  });
}
