"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";

interface PersonalMemoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMemories: string[];
  onSave: (memories: string[]) => Promise<void>;
  isSaving: boolean;
}

function AutoExpandingTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(160, textarea.scrollHeight)}px`;
    }
  };

  useLayoutEffect(() => {
    adjustHeight();
  }, [value]);

  useEffect(() => {
    window.addEventListener("resize", adjustHeight);
    return () => window.removeEventListener("resize", adjustHeight);
  }, []);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        adjustHeight();
      }}
      placeholder={placeholder}
      className="w-full text-xs bg-white border border-border rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-[#7A5AF8] text-gray-800 leading-relaxed resize-none overflow-hidden min-h-[160px] h-auto"
    />
  );
}

export function PersonalMemoriesModal({ isOpen, onClose, initialMemories, onSave, isSaving }: PersonalMemoriesModalProps) {
  const [list, setList] = useState<{ id: string; content: string; isEditing: boolean }[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (isOpen) {
      if (!hasInitialized.current) {
        if (initialMemories.length > 0) {
          setList(initialMemories.map((m, idx) => ({
            id: idx.toString(),
            content: m,
            isEditing: false
          })));
        } else {
          setList([{ id: "0", content: "", isEditing: true }]);
        }
        hasInitialized.current = true;
      }
    } else {
      hasInitialized.current = false;
      setConfirmDeleteId(null);
    }
  }, [isOpen, initialMemories]);

  if (!isOpen) return null;

  const handleAdd = () => {
    setList([...list, { id: Date.now().toString(), content: "", isEditing: true }]);
  };

  const handleDeleteClick = (id: string) => {
    const item = list.find(it => it.id === id);
    // If the memory has no text, delete immediately without confirmation
    if (!item || item.content.trim() === "") {
      setList(list.filter(it => it.id !== id));
      return;
    }
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = (id: string) => {
    setList(list.filter(it => it.id !== id));
    setConfirmDeleteId(null);
  };

  const handleCancelDelete = () => {
    setConfirmDeleteId(null);
  };

  const handleEdit = (id: string) => {
    setList(list.map(item => item.id === id ? { ...item, isEditing: true } : item));
  };

  const handleSaveItem = (id: string, newContent: string) => {
    setList(list.map(item => item.id === id ? { ...item, content: newContent, isEditing: false } : item));
  };

  const handleChangeText = (id: string, text: string) => {
    setList(list.map(item => item.id === id ? { ...item, content: text } : item));
  };

  const handleSaveAll = async () => {
    // Filter out empty memories
    const validMemories = list.map(item => item.content.trim()).filter(c => c !== "");
    await onSave(validMemories);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full p-6 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="mb-4">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 justify-start">
            ✨ Personal Memories
          </h3>
          <p className="text-xs font-semibold text-[#7A5AF8] mt-1 text-left">
            What happened today that only you know?
          </p>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed text-left">
            Your AI already knows what happened inside HAMUN. Now tell it the moments, conversations, emotions, and experiences that only you remember.
          </p>
        </div>

        {/* Examples */}
        <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-4 mb-4 text-left">
          <h4 className="text-[11px] font-bold text-purple-700 uppercase tracking-wider mb-1.5">Examples:</h4>
          <ul className="text-xs text-purple-900/85 space-y-1 list-disc pl-4">
            <li>Met an old friend after class.</li>
            <li>Had dinner with my family.</li>
            <li>Felt nervous before my interview.</li>
            <li>Professor appreciated my project.</li>
            <li>Had an amazing conversation with my mentor.</li>
          </ul>
        </div>

        {/* Memories list */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-1 custom-scrollbar">
          {list.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-4">
              {confirmDeleteId === item.id ? (
                <div className="flex items-center justify-between w-full animate-in fade-in duration-200 py-1 text-left">
                  <span className="text-xs font-semibold text-red-600 flex items-center gap-1.5 justify-start">
                    ⚠️ Delete this memory permanently?
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleConfirmDelete(item.id)}
                      className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3.5 py-1.5 rounded-full shadow-sm transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={handleCancelDelete}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-3.5 py-1.5 rounded-full hover:bg-gray-200/50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : item.isEditing ? (
                <div className="flex flex-col gap-3">
                  <AutoExpandingTextarea
                    value={item.content}
                    onChange={(text) => handleChangeText(item.id, text)}
                    placeholder="Write about an important moment, conversation, feeling, experience, or event from today..."
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleSaveItem(item.id, item.content)}
                      className="text-xs font-semibold bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1.5 rounded-full transition-colors"
                    >
                      Save Draft
                    </button>
                    <button
                      onClick={() => handleDeleteClick(item.id)}
                      className="text-xs font-semibold text-red-500 hover:text-red-700 px-3 py-1.5 rounded-full transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="text-xs text-gray-700 leading-relaxed text-left whitespace-pre-wrap font-sans">
                    {item.content}
                  </div>
                  <div className="flex items-center justify-end gap-2 border-t border-gray-200/50 pt-2">
                    <button
                      onClick={() => handleEdit(item.id)}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-200/50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(item.id)}
                      className="text-xs font-semibold text-red-500 hover:text-red-700 px-3 py-1.5 rounded-full hover:bg-red-550 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          <button
            onClick={handleAdd}
            className="w-full border border-dashed border-gray-300 hover:border-purple-300 rounded-2xl py-3 text-xs text-gray-500 hover:text-[#7A5AF8] transition-colors flex items-center justify-center gap-1 font-medium bg-white"
          >
            + Add Another Personal Memory
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 shrink-0">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-6 py-2 text-xs font-semibold text-white bg-[#7A5AF8] hover:bg-[#6346E0] rounded-full shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSaving ? "Saving..." : "Save Memories"}
          </button>
        </div>
      </div>
    </div>
  );
}
