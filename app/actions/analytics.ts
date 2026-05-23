"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Stage } from "@prisma/client";

export async function getAnalytics() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  const contacts = await prisma.contact.findMany({
    where: { userId, isArchived: false },
    select: {
      stage: true,
      moneyValue: true,
      source: true,
    },
  });

  // Basic Stats
  const totalContacts = contacts.length;
  const pipelineValue = contacts
    .filter((c) => c.stage !== Stage.REJECTED)
    .reduce((acc, c) => acc + Number(c.moneyValue), 0);
  
  const convertedValue = contacts
    .filter((c) => c.stage === Stage.CUSTOMER)
    .reduce((acc, c) => acc + Number(c.moneyValue), 0);

  const conversionRate = totalContacts > 0 
    ? (contacts.filter(c => c.stage === Stage.CUSTOMER).length / totalContacts) * 100 
    : 0;

  const validDeals = contacts.filter((c) => c.stage !== Stage.REJECTED && Number(c.moneyValue) > 0);
  const avgDealSize = validDeals.length > 0 ? pipelineValue / validDeals.length : 0;

  // Stage Breakdown for Bar Chart
  const stageBreakdown = Object.values(Stage).map((stage) => ({
    name: stage,
    count: contacts.filter((c) => c.stage === stage).length,
    value: contacts
      .filter((c) => c.stage === stage)
      .reduce((acc, c) => acc + Number(c.moneyValue), 0),
  }));

  // Source Breakdown for Pie Chart
  const sources = Array.from(new Set(contacts.map((c) => c.source || "Unknown")));
  const sourceBreakdown = sources.map((source) => ({
    name: source,
    value: contacts.filter((c) => c.source === (source === "Unknown" ? null : source)).length,
  }));

  return {
    stats: {
      totalContacts,
      pipelineValue,
      convertedValue,
      conversionRate: Math.round(conversionRate * 10) / 10,
      avgDealSize: Math.round(avgDealSize),
    },
    stageBreakdown,
    sourceBreakdown,
  };
}
