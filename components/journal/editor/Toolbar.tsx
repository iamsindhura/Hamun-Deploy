"use client";

import { Editor } from '@tiptap/react';
import { 
  Bold, Italic, Underline as UnderlineIcon, 
  Heading1, Heading2, Quote, List, ListOrdered, 
  Minus, Image as ImageIcon, SmilePlus, Undo, Redo 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useRef, useState } from 'react';
import { ImageUploadService } from '@/lib/image-upload-service';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { StickerPicker } from './sticker-picker';

interface ToolbarProps {
  editor: Editor;
}

export function Toolbar({ editor }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isStickerOpen, setIsStickerOpen] = useState(false);

  if (!editor) {
    return null;
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const result = await ImageUploadService.uploadImage(file);
    setIsUploading(false);
    
    if (result.success && result.url) {
      editor.chain().focus().insertContent({ type: 'customImage', attrs: { src: result.url } }).run();
    } else {
      alert(result.error || "Failed to upload image");
    }
    
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-muted/50 border border-border rounded-t-xl">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().undo().run(); }}
          disabled={!editor.can().undo()}
          className="h-8 w-8 p-0"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().redo().run(); }}
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
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
          className={cn("h-8 w-8 p-0", editor.isActive('bold') && "bg-[#E5E7EB] text-[#111827]")}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
          className={cn("h-8 w-8 p-0", editor.isActive('italic') && "bg-[#E5E7EB] text-[#111827]")}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); }}
          className={cn("h-8 w-8 p-0", editor.isActive('underline') && "bg-[#E5E7EB] text-[#111827]")}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run(); }}
          className={cn("h-8 w-8 p-0", editor.isActive('heading', { level: 1 }) && "bg-[#E5E7EB] text-[#111827]")}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); }}
          className={cn("h-8 w-8 p-0", editor.isActive('heading', { level: 2 }) && "bg-[#E5E7EB] text-[#111827]")}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBlockquote().run(); }}
          className={cn("h-8 w-8 p-0", editor.isActive('blockquote') && "bg-[#E5E7EB] text-[#111827]")}
        >
          <Quote className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
          className={cn("h-8 w-8 p-0", editor.isActive('bulletList') && "bg-[#E5E7EB] text-[#111827]")}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
          className={cn("h-8 w-8 p-0", editor.isActive('orderedList') && "bg-[#E5E7EB] text-[#111827]")}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setHorizontalRule().run(); }}
          className="h-8 w-8 p-0"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <div className="flex items-center gap-1">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleImageUpload} 
        />
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(e) => { e.preventDefault(); triggerImageUpload(); }}
          disabled={isUploading}
          className="h-8 w-8 p-0"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
        </Button>
        <Popover open={isStickerOpen} onOpenChange={setIsStickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-8 w-8 p-0", isStickerOpen && "bg-[#E5E7EB] text-[#111827]")}
            >
              <SmilePlus className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end" sideOffset={8}>
            <StickerPicker 
              onSelect={(sticker) => {
                editor.chain().focus().insertContent(sticker).run();
              }} 
              onClose={() => setIsStickerOpen(false)}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
