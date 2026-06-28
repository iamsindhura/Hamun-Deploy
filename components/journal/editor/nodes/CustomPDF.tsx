import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState } from 'react';
import { Trash2, FileText, Download, Maximize2, Minimize2 } from 'lucide-react';

const PDFNodeView = (props: any) => {
  const { node, deleteNode } = props;
  const { src, filename, pages, size, attachmentId } = node.attrs;
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDelete = () => {
    if (attachmentId) {
      document.dispatchEvent(new CustomEvent('attachment-deleted', { detail: { id: attachmentId } }));
    }
    deleteNode();
  };

  return (
    <NodeViewWrapper className="relative my-4 flex justify-center w-full group">
      <div className={`relative bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all duration-300 ${isExpanded ? 'w-full max-w-2xl' : 'w-full max-w-sm'}`}>
        {/* Header / Compact View */}
        <div className="flex items-center p-3 gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100">
            <FileText className="w-5 h-5 text-rose-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[13px] font-semibold text-gray-800 truncate">{filename || "Document.pdf"}</h4>
            <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
              <span>PDF Document</span>
              {pages > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span>{pages} Pages</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 transition-colors"
              title={isExpanded ? "Collapse" : "Expand Preview"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <a 
              href={src} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 transition-colors"
              title="Download/Open"
            >
              <Download className="w-4 h-4" />
            </a>
            <button 
              onClick={handleDelete} 
              className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded Preview View (Simulated since rendering actual PDF inline requires heavy iframe or pdf.js) */}
        {isExpanded && (
          <div className="border-t border-gray-100 bg-gray-50 p-4 h-80 flex flex-col items-center justify-center">
             <iframe src={`${src}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full rounded shadow-sm border border-gray-200" title="PDF Preview"></iframe>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const CustomPDF = Node.create({
  name: 'customPDF',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      filename: { default: '' },
      pages: { default: 0 },
      size: { default: 0 },
      attachmentId: { default: null },
      summary: { default: null } 
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="pdf"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'pdf' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PDFNodeView);
  },
});
