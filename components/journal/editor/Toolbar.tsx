"use client";

import { Editor } from '@tiptap/react';
import { 
  Bold, Italic, Underline as UnderlineIcon, 
  Heading1, Heading2, Quote, List, ListOrdered, 
  Minus, Image as ImageIcon, SmilePlus, Undo, Redo 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface ToolbarProps {
  editor: Editor;
}

export function Toolbar({ editor }: ToolbarProps) {
  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt('URL of the image:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-muted/50 border border-border rounded-t-xl">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-8 w-8 p-0"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-8 w-8 p-0"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-muted' : ''}`}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-muted' : ''}`}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('underline') ? 'bg-muted' : ''}`}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`h-8 w-8 p-0 ${editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}`}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`h-8 w-8 p-0 ${editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}`}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('blockquote') ? 'bg-muted' : ''}`}
        >
          <Quote className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('bulletList') ? 'bg-muted' : ''}`}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('orderedList') ? 'bg-muted' : ''}`}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="h-8 w-8 p-0"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={addImage}
          className="h-8 w-8 p-0"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            // Placeholder for sticker drawer
            alert("Sticker Drawer opens here");
          }}
          className="h-8 w-8 p-0"
        >
          <SmilePlus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
