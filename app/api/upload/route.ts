import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StorageService } from "@/lib/storage/service";
import { analyzeImage } from "@/lib/ai/vision";
import { transcribeAudio } from "@/lib/ai/audio";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;
    const journalId = formData.get("journalId") as string | null;
    const taskId = formData.get("taskId") as string | null;
    const projectId = formData.get("projectId") as string | null;
    const contactId = formData.get("contactId") as string | null;

    if (!file || !type) {
      return NextResponse.json({ error: "File and type are required" }, { status: 400 });
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate size (e.g. 50MB limit)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (buffer.length > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
    }

    // Save via StorageService
    const storagePath = await StorageService.save(buffer, file.name);
    
    // Process based on type
    let summary = null;
    let caption = null;
    let pages = null;
    let duration = null;

    if (type === "IMAGE") {
      const imageData = await analyzeImage(buffer, file.type);
      summary = imageData.summary;
      caption = imageData.caption;
    } else if (type === "VOICE") {
      const audioData = await transcribeAudio(buffer, file.type);
      summary = audioData.summary;
      duration = audioData.duration;
    }

    // Store in Database
    const attachment = await prisma.attachment.create({
      data: {
        userId: session.user.id,
        journalId: journalId || null,
        taskId: taskId || null,
        projectId: projectId || null,
        contactId: contactId || null,
        type: type,
        filename: file.name,
        storagePath: storagePath,
        mimeType: file.type,
        size: buffer.length,
        summary: summary,
        pages: pages,
        duration: duration,
      }
    });

    return NextResponse.json({ 
      attachment: {
        ...attachment,
        caption: caption // Add to response purely for Tiptap to consume on the frontend
      } 
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
