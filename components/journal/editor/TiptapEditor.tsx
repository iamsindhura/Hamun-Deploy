"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { CustomImage } from './nodes/CustomImage';
import { CustomAudio } from './nodes/CustomAudio';
import { Toolbar } from './Toolbar';
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

export interface TiptapEditorRef {
  insertAttachment: (attachment: any) => void;
}

interface TiptapEditorProps {
  initialContent: any;
  onUpdate: (content: any) => void;
  editable?: boolean;
  editorSticker?: string | null;
  onStickerInserted?: () => void;
}

export const TiptapEditor = forwardRef<TiptapEditorRef, TiptapEditorProps>(
  ({ initialContent, onUpdate, editable = true, editorSticker, onStickerInserted }, ref) => {
    const onUpdateRef = useRef(onUpdate);
    
    useEffect(() => {
      onUpdateRef.current = onUpdate;
    }, [onUpdate]);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        Placeholder.configure({
          placeholder: 'Write your story...',
        }),
        Underline,
        CustomImage,
        CustomAudio,
      ],
      content: initialContent,
      editable,
      onUpdate: ({ editor }) => {
        onUpdateRef.current(editor.getJSON());
      },
      editorProps: {
        attributes: {
          class: 'prose prose-slate dark:prose-invert prose-lg max-w-none focus:outline-none min-h-[400px]',
        },
      },
      immediatelyRender: true,
    });

    useImperativeHandle(ref, () => ({
      insertAttachment: (attachment: any) => {
        if (!editor) return;

        if (attachment.type === "IMAGE") {
          editor.chain().focus().insertContent({
            type: 'customImage',
            attrs: {
              src: attachment.storagePath,
              attachmentId: attachment.id,
              summary: attachment.summary || null,
              caption: attachment.caption || "",
            }
          }).run();
        } else if (attachment.type === "VOICE") {
          editor.chain().focus().insertContent({
            type: 'customAudio',
            attrs: {
              src: attachment.storagePath,
              attachmentId: attachment.id,
              duration: attachment.duration || 0,
              transcript: attachment.summary || "",
              summary: attachment.summary || null
            }
          }).run();
        }
      }
    }));

    // Update content if initialContent changes (e.g. switching journals)
    useEffect(() => {
      if (editor && initialContent && !editor.isDestroyed) {
        const currentJSON = editor.getJSON();
        if (JSON.stringify(currentJSON) !== JSON.stringify(initialContent)) {
          editor.commands.setContent(initialContent);
        }
      }
    }, [initialContent, editor]);

    // Dynamically update editable state when Edit Mode is toggled
    useEffect(() => {
      if (editor && !editor.isDestroyed) {
        editor.setEditable(editable);
      }
    }, [editable, editor]);

    // Insert sticker when requested
    useEffect(() => {
      if (editor && editorSticker && editable) {
        editor.chain().focus().insertContent(editorSticker).run();
        onStickerInserted?.();
      }
    }, [editorSticker, editor, editable, onStickerInserted]);

    if (!editor) {
      return null;
    }

    return (
      <div className="flex flex-col w-full h-full">
        {editable && <Toolbar editor={editor} />}
        <div className={`flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-8 bg-transparent ${editable ? 'border-x border-b border-border shadow-sm rounded-b-xl bg-white mt-0' : ''}`}>
          <EditorContent editor={editor} />
        </div>
      </div>
    );
  }
);

TiptapEditor.displayName = "TiptapEditor";
