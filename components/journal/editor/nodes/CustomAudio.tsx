import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Mic, Play, Pause, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const AudioNodeView = (props: any) => {
  const { node, updateAttributes, deleteNode } = props;
  const { src, duration, attachmentId, transcript } = node.attrs;
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleDelete = () => {
    if (attachmentId) {
      document.dispatchEvent(new CustomEvent('attachment-deleted', { detail: { id: attachmentId } }));
    }
    deleteNode();
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration || 1;
      setProgress((current / total) * 100);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const formatTime = (secs: number) => {
    if (!secs) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <NodeViewWrapper className="relative my-4 flex justify-center w-full group">
      <div className="w-full max-w-lg bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        
        {/* Audio Player Header */}
        <div className="flex items-center p-3 gap-3">
          <button 
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-[#7A5AF8] hover:bg-[#6b4ce6] flex items-center justify-center shrink-0 shadow-sm transition-colors text-white"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>
          
          <div className="flex-1 flex flex-col justify-center gap-1.5">
            <div className="flex justify-between items-center text-[10px] text-gray-500 font-medium px-1">
              <span>{audioRef.current ? formatTime(audioRef.current.currentTime) : "0:00"}</span>
              <span className="flex items-center gap-1"><Mic className="w-3 h-3 text-emerald-500" /> Voice Note</span>
              <span>{formatTime(duration)}</span>
            </div>
            {/* CSS Waveform Simulation */}
            <div className="w-full h-8 bg-gray-50 rounded-md relative overflow-hidden flex items-center px-1 gap-[2px]">
              {Array.from({ length: 40 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`flex-1 rounded-full transition-all duration-300 ${i / 40 * 100 <= progress ? 'bg-[#7A5AF8]' : 'bg-gray-200'}`}
                  style={{ height: `${Math.max(15, Math.random() * 100)}%` }}
                />
              ))}
              {/* Actual invisible audio element */}
              <audio 
                ref={audioRef} 
                src={src} 
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                className="hidden" 
              />
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button 
              onClick={() => setShowTranscript(!showTranscript)}
              className={`p-2 rounded-lg transition-colors ${showTranscript ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-100 text-gray-400'}`}
              title="Toggle Transcript"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button 
              onClick={handleDelete}
              className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Transcript Section */}
        {showTranscript && (
          <div className="border-t border-gray-100 bg-gray-50/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">AI Transcript</span>
            </div>
            <textarea 
              value={transcript || ""}
              onChange={(e) => updateAttributes({ transcript: e.target.value })}
              placeholder="Audio transcription will appear here..."
              className="w-full h-24 bg-transparent border border-transparent hover:border-gray-200 focus:border-indigo-300 focus:bg-white rounded-lg p-2 text-xs text-gray-600 leading-relaxed resize-none outline-none transition-all custom-scrollbar"
            />
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const CustomAudio = Node.create({
  name: 'customAudio',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      duration: { default: 0 },
      attachmentId: { default: null },
      transcript: { default: '' },
      summary: { default: null }
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="audio"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'audio' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AudioNodeView);
  },
});
