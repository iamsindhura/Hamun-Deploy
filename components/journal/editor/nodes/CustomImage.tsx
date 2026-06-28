import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import React, { useState } from 'react';
import { Trash2, AlignLeft, AlignCenter, AlignRight, Maximize } from 'lucide-react';

const ImageNodeView = (props: any) => {
  const { node, updateAttributes, deleteNode } = props;
  const { src, caption, align, size, attachmentId } = node.attrs;
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = () => {
    // We optionally trigger a global event so the sidebar can also remove the attachment
    if (attachmentId) {
      document.dispatchEvent(new CustomEvent('attachment-deleted', { detail: { id: attachmentId } }));
    }
    deleteNode();
  };

  const getWidth = () => {
    switch (size) {
      case 'small': return 'w-1/3';
      case 'medium': return 'w-1/2';
      case 'large': return 'w-3/4';
      case 'full': return 'w-full';
      default: return 'w-1/2';
    }
  };

  const getAlignment = () => {
    switch (align) {
      case 'left': return 'mr-auto';
      case 'center': return 'mx-auto';
      case 'right': return 'ml-auto';
      default: return 'mx-auto';
    }
  };

  return (
    <NodeViewWrapper className={`relative flex flex-col group my-6 ${getAlignment()} ${getWidth()}`}>
      <div 
        className="relative rounded-xl overflow-hidden border border-gray-100 shadow-sm transition-all"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={caption || "Journal image"} className="w-full h-auto object-cover" />

        {/* Hover Toolbar */}
        <div className={`absolute top-2 right-2 flex items-center gap-1 p-1 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <button onClick={() => updateAttributes({ align: 'left' })} className={`p-1.5 rounded-md hover:bg-gray-100 transition-colors ${align === 'left' ? 'text-blue-500 bg-blue-50' : 'text-gray-500'}`} title="Align Left"><AlignLeft className="w-3.5 h-3.5" /></button>
          <button onClick={() => updateAttributes({ align: 'center' })} className={`p-1.5 rounded-md hover:bg-gray-100 transition-colors ${align === 'center' ? 'text-blue-500 bg-blue-50' : 'text-gray-500'}`} title="Align Center"><AlignCenter className="w-3.5 h-3.5" /></button>
          <button onClick={() => updateAttributes({ align: 'right' })} className={`p-1.5 rounded-md hover:bg-gray-100 transition-colors ${align === 'right' ? 'text-blue-500 bg-blue-50' : 'text-gray-500'}`} title="Align Right"><AlignRight className="w-3.5 h-3.5" /></button>
          <div className="w-px h-4 bg-gray-200 mx-0.5"></div>
          <button onClick={() => updateAttributes({ size: size === 'small' ? 'medium' : size === 'medium' ? 'large' : size === 'large' ? 'full' : 'small' })} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors" title="Toggle Size"><Maximize className="w-3.5 h-3.5" /></button>
          <div className="w-px h-4 bg-gray-200 mx-0.5"></div>
          <button onClick={handleDelete} className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      
      <div className="mt-2 text-center w-full">
        <input 
          type="text" 
          placeholder="Add a caption..."
          value={caption || ""}
          onChange={(e) => updateAttributes({ caption: e.target.value })}
          className="w-full bg-transparent border-none outline-none text-[11px] text-gray-500 text-center font-medium placeholder-gray-400 italic"
        />
      </div>
    </NodeViewWrapper>
  );
};

export const CustomImage = Node.create({
  name: 'customImage',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      caption: { default: '' },
      align: { default: 'center' },
      size: { default: 'medium' },
      attachmentId: { default: null },
      summary: { default: null } // Storing the AI summary internally
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});
