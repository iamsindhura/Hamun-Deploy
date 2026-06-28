import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StorageService } from "@/lib/storage/service";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const attachment = await prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment || attachment.userId !== session.user.id) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    // Delete from storage
    await StorageService.delete(attachment.storagePath);

    // Delete from DB
    await prisma.attachment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete attachment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
