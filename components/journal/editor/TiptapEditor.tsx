"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import { Toolbar } from './Toolbar';
import { useEffect } from 'react';

interface TiptapEditorProps {
  initialContent: any;
  onUpdate: (content: any) => void;
  editable?: boolean;
  editorSticker?: string | null;
  onStickerInserted?: () => void;
}

export function TiptapEditor({ initialContent, onUpdate, editable = true, editorSticker, onStickerInserted }: TiptapEditorProps) {
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
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
    ],
    content: initialContent,
    editable,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate dark:prose-invert prose-lg max-w-none focus:outline-none min-h-[400px]',
      },
    },
  });

  // Update content if initialContent changes (e.g. switching journals)
  useEffect(() => {
    if (editor && initialContent && !editor.isDestroyed) {
      const currentJSON = editor.getJSON();
      if (JSON.stringify(currentJSON) !== JSON.stringify(initialContent)) {
        editor.commands.setContent(initialContent);
      }
    }
  }, [initialContent, editor]);

  // Insert sticker when requested
  useEffect(() => {
    if (editor && editorSticker && editable) {
      editor.commands.insertContent(editorSticker);
      onStickerInserted?.();
    }
  }, [editorSticker, editor, editable, onStickerInserted]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col w-full h-full">
      {editable && <Toolbar editor={editor} />}
      <div className={`flex-1 overflow-y-auto px-8 py-10 bg-transparent ${editable ? 'border-x border-b border-border shadow-sm rounded-b-xl bg-white' : ''}`}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
