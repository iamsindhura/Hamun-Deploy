"use client";

import React, { useState, useRef, useEffect } from "react";
import { Paperclip, Image as ImageIcon, Mic, FileText, UploadCloud, Loader2, Trash2, Eye, Sparkles, PlusCircle } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function formatBytes(bytes?: number, decimals = 1) {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatDuration(seconds?: number) {
  if (!seconds) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

interface Attachment {
  id: string;
  type: string;
  filename: string;
  storagePath: string;
  summary?: string;
  size?: number;
  duration?: number;
  createdAt?: string | Date;
}

interface JournalAttachmentsProps {
  journalId?: string;
  initialAttachments?: Attachment[];
  onUploadComplete?: (attachment: Attachment) => void;
  onEnsureJournal?: () => Promise<string | undefined>;
  onInsertAttachment?: (attachment: Attachment) => void;
}

export function JournalAttachments({ journalId, initialAttachments = [], onUploadComplete, onEnsureJournal, onInsertAttachment }: JournalAttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<"IMAGE" | "VOICE" | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);

  // Sync state if initialAttachments change
  useEffect(() => {
    setAttachments(initialAttachments);
  }, [initialAttachments]);

  const [activeUploadJournalId, setActiveUploadJournalId] = useState<string | null>(null);

  const handleFileSelect = async (type: "IMAGE" | "VOICE") => {
    setUploadType(type);
    
    let currentId = journalId;
    if (!currentId && onEnsureJournal) {
      const newId = await onEnsureJournal();
      if (newId) currentId = newId;
    }

    if (!currentId) {
      console.error("Could not ensure journal exists for upload");
      return;
    }
    
    setActiveUploadJournalId(currentId);

    if (fileInputRef.current) {
      if (type === "IMAGE") fileInputRef.current.accept = "image/png, image/jpeg, image/webp";
      if (type === "VOICE") fileInputRef.current.accept = "audio/mp3, audio/wav, audio/m4a, audio/webm";
      fileInputRef.current.click();
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetJournalId = activeUploadJournalId || journalId;
    if (!file || !uploadType || !targetJournalId) return;

    setIsUploading(true);
    setUploadProgress(10); // Fake initial progress

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", uploadType);
    formData.append("journalId", targetJournalId);

    try {
      // Fake progress increment
      const interval = setInterval(() => {
        setUploadProgress(p => (p < 90 ? p + 10 : p));
      }, 500);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);
      setUploadProgress(100);

      if (res.ok) {
        const data = await res.json();
        setAttachments((prev) => [...prev, data.attachment]);
        if (onUploadComplete) {
          onUploadComplete(data.attachment);
        }
      } else {
        console.error("Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const deleteAttachment = async (id: string) => {
    try {
      setAttachments(prev => prev.filter(a => a.id !== id));
      await fetch(`/api/attachments/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  useEffect(() => {
    const handleAttachmentDeleted = (e: any) => {
      if (e.detail?.id) {
        deleteAttachment(e.detail.id);
      }
    };
    document.addEventListener('attachment-deleted', handleAttachmentDeleted);
    return () => {
      document.removeEventListener('attachment-deleted', handleAttachmentDeleted);
    };
  }, []);

  const totalSize = attachments.reduce((sum, att) => sum + (att.size || 0), 0);

  const clearAll = async () => {
    for (const att of attachments) {
      await deleteAttachment(att.id);
    }
  };

  return (
    <div className="font-sans">
      <h3 className="text-sm font-bold text-[#4B5563] tracking-wide mb-3 flex items-center gap-2">
        <Paperclip className="w-4 h-4" /> ATTACHMENTS
      </h3>
      <div className="bg-white rounded-[20px] p-2 border border-[#E5E7EB] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] relative overflow-hidden">
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={onFileChange} 
        />

        {/* Action Buttons */}
        <div className="p-3">
          <div className="grid grid-cols-2 gap-3">
            <button 
              disabled={isUploading}
              onClick={() => handleFileSelect("IMAGE")}
              className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors border border-dashed border-gray-200 disabled:opacity-50"
            >
              <ImageIcon className="w-5 h-5 text-[#4B5563]" />
              <span className="text-[11px] font-bold text-[#4B5563] tracking-wider uppercase">Image</span>
            </button>
            <button 
              disabled={isUploading}
              onClick={() => handleFileSelect("VOICE")}
              className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors border border-dashed border-gray-200 disabled:opacity-50"
            >
              <Mic className="w-5 h-5 text-[#4B5563]" />
              <span className="text-[11px] font-bold text-[#4B5563] tracking-wider uppercase">Voice</span>
            </button>
          </div>
        </div>

        {isUploading && (
          <div className="px-5 pb-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5 font-medium">
              <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin text-[#7A5AF8]" /> Processing...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#7A5AF8] transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {attachments.length === 0 && !isUploading && (
          <div className="text-center py-8 px-4 border-t border-gray-100">
            <UploadCloud className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500 font-medium">No attachments yet.</p>
            <p className="text-xs text-gray-400 mt-1">Upload context for AI Analysis</p>
          </div>
        )}

        {attachments.length > 0 && (
          <div className="mt-2">
            {/* Summary Header */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <div className="text-[13px] text-gray-500 font-medium">
                {attachments.length} attachment{attachments.length !== 1 ? 's' : ''} • {formatBytes(totalSize)}
              </div>
              <button 
                onClick={clearAll}
                className="flex items-center gap-1.5 text-[13px] font-medium text-red-500 hover:text-red-600 transition-colors"
              >
                Clear all <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List */}
            <div className="px-3 pb-3 space-y-2.5">
              {attachments.map((att) => {
                let badgeStyle = "bg-[#F3E8FF] text-[#6B21A8]";
                let badgeText = "Image";
                if (att.type === "VOICE") {
                  badgeStyle = "bg-[#F3E8FF] text-[#6B21A8]";
                  badgeText = "Voice";
                }

                const timeStr = att.createdAt 
                  ? formatDistanceToNow(new Date(att.createdAt), { addSuffix: true }).replace("about ", "")
                  : "just now";

                let aiText = "";
                let aiStatus = "⏳ Analyzing...";
                if (att.type === "VOICE" && att.summary) {
                  aiText = `Transcribed: "${att.summary.length > 50 ? att.summary.substring(0, 50) + "..." : att.summary}"`;
                  aiStatus = "🟢 Ready";
                } else if (att.summary) {
                  aiText = `AI detected: ${att.summary.length > 60 ? att.summary.substring(0, 60) + "..." : att.summary}`;
                  aiStatus = "🟢 Ready";
                }

                return (
                  <div key={att.id} className="group flex flex-col p-3 rounded-[14px] border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all relative">
                    <div className="flex items-stretch">
                      {/* Thumbnail Column */}
                    <div 
                      className="w-14 shrink-0 flex items-center justify-center mr-3 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setPreviewAttachment(att)}
                    >
                        {att.type === "IMAGE" && (
                          <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                            {att.storagePath ? (
                              <img src={att.storagePath} alt={att.filename} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            )}
                          </div>
                        )}
                        {att.type === "VOICE" && (
                        <div className="relative w-12 h-12 bg-[#F3E8FF] rounded-xl flex items-center justify-center">
                          <div className="flex items-center justify-center gap-[2px]">
                            <div className="w-0.5 h-2 bg-[#7A5AF8] rounded-full"></div>
                            <div className="w-0.5 h-4 bg-[#7A5AF8] rounded-full"></div>
                            <div className="w-0.5 h-3 bg-[#7A5AF8] rounded-full"></div>
                            <div className="w-0.5 h-5 bg-[#7A5AF8] rounded-full"></div>
                            <div className="w-0.5 h-2 bg-[#7A5AF8] rounded-full"></div>
                          </div>
                          {att.duration !== undefined && (
                            <div className="absolute -bottom-2 bg-[#1F2937] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                              {formatDuration(att.duration)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-bold text-[#111827] truncate">
                          {att.filename}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badgeStyle}`}>
                          {badgeText}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-500 mb-1.5 font-medium leading-tight">
                        <span className="shrink-0">{formatBytes(att.size)}</span>
                        <span className="shrink-0">•</span>
                        <span className="shrink-0">{timeStr}</span>
                        <span className="shrink-0">•</span>
                        <span className={`shrink-0 ${att.summary ? "text-green-600 font-bold" : "text-amber-500 font-bold"}`}>{aiStatus}</span>
                      </div>

                      <div className="text-[11px] text-gray-400 line-clamp-2 leading-tight">
                        {aiText}
                      </div>
                    </div>

                    {/* Actions Column */}
                    <div className="flex flex-col items-center justify-center gap-3 ml-2 pl-3 shrink-0 border-l border-gray-50">
                      <button 
                        onClick={() => setPreviewAttachment(att)}
                        className="text-gray-400 hover:text-gray-600 transition-colors" 
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteAttachment(att.id)}
                        className="text-[#EF4444] hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    </div>

                    {/* Manual Insert Button row */}
                    {onInsertAttachment && (
                      <div className="mt-3 pt-2 border-t border-gray-50 flex justify-end">
                        <button 
                          onClick={() => onInsertAttachment(att)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F8F5FF] hover:bg-[#F3E8FF] text-[#7A5AF8] text-[11px] font-bold rounded-lg transition-colors border border-[#E9D5FF]"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          Insert into Journal
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* AI Footer */}
            <div className="mx-3 mb-3 bg-[#F8F5FF] rounded-[14px] p-3.5 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-[#7A5AF8] shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-bold text-[#5B21B6] leading-snug">
                  These attachments will be used for AI analysis and journal generation.
                </p>
                <p className="text-[11px] text-[#7C3AED] mt-0.5">
                  You can click on any attachment to preview it.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        <Dialog open={!!previewAttachment} onOpenChange={(open) => !open && setPreviewAttachment(null)}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white border-0 shadow-2xl">
            <DialogHeader className="p-4 border-b border-gray-100 bg-gray-50/50">
              <DialogTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
                {previewAttachment?.type === "IMAGE" ? <ImageIcon className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {previewAttachment?.filename || "Preview"}
              </DialogTitle>
            </DialogHeader>
            <div className="p-4 bg-[#FAFAFA] flex items-center justify-center min-h-[300px]">
              {previewAttachment?.type === "IMAGE" && previewAttachment.storagePath && (
                <div className="relative w-full h-[60vh] max-h-[600px] rounded-lg overflow-hidden shadow-inner bg-white flex items-center justify-center">
                  <img 
                    src={previewAttachment.storagePath} 
                    alt={previewAttachment.filename} 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
              {previewAttachment?.type === "VOICE" && previewAttachment.storagePath && (
                <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                  <div className="w-16 h-16 bg-[#F3E8FF] rounded-full flex items-center justify-center mb-6">
                    <Mic className="w-8 h-8 text-[#7A5AF8]" />
                  </div>
                  <audio 
                    controls 
                    src={previewAttachment.storagePath} 
                    className="w-full focus:outline-none"
                    autoPlay
                  />
                </div>
              )}
            </div>
            {previewAttachment?.summary && (
              <div className="p-4 bg-white border-t border-gray-100">
                <h4 className="text-xs font-bold text-[#7A5AF8] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> AI Analysis
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {previewAttachment.summary}
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
