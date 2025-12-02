import React, { useState, useRef, useEffect } from 'react';
import { NoteColor } from '../types';
import { Image, CheckSquare, Sparkles, Plus, X } from 'lucide-react';
import * as GeminiService from '../services/geminiService';

interface CreateNoteProps {
  onCreate: (title: string, content: string, color: NoteColor) => void;
}

const CreateNote: React.FC<CreateNoteProps> = ({ onCreate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState<NoteColor>(NoteColor.DEFAULT);
  const [isGenerating, setIsGenerating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (title || content) {
          handleClose();
        } else {
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, color]);

  const handleClose = () => {
    if (title.trim() || content.trim()) {
      onCreate(title, content, color);
    }
    setTitle('');
    setContent('');
    setColor(NoteColor.DEFAULT);
    setIsExpanded(false);
  };

  const handleAIGenerateTitle = async () => {
    if (!content) return;
    setIsGenerating(true);
    const newTitle = await GeminiService.generateTitle(content);
    if (newTitle) setTitle(newTitle);
    setIsGenerating(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-10 relative z-10 px-4">
      <div 
        ref={containerRef}
        className={`relative bg-neutral-800 border border-neutral-700 shadow-xl transition-all duration-300 ease-in-out ${isExpanded ? 'rounded-lg' : 'rounded-full hover:bg-neutral-800/80 cursor-text'}`}
      >
        {!isExpanded ? (
          <div 
            onClick={() => setIsExpanded(true)}
            className="flex items-center justify-between p-4 pl-6"
          >
            <span className="text-zinc-400 font-medium text-lg">Take a note...</span>
            <div className="flex gap-4 text-zinc-400">
              <CheckSquare size={20} />
              <Image size={20} />
            </div>
          </div>
        ) : (
          <div className={`flex flex-col ${color} rounded-lg transition-colors duration-300`}>
            {isGenerating && (
                <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] z-20 flex items-center justify-center rounded-lg">
                    <div className="flex items-center gap-2 text-primary font-medium bg-surface px-4 py-2 rounded-full shadow-lg border border-white/5">
                        <Sparkles className="animate-spin" size={16} />
                        <span>AI Thinking...</span>
                    </div>
                </div>
            )}
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent text-zinc-100 placeholder-zinc-400 font-bold text-lg p-4 pb-2 focus:outline-none w-full"
            />
            <textarea
              placeholder="Take a note..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-transparent text-zinc-300 placeholder-zinc-500 p-4 pt-2 focus:outline-none resize-none min-h-[120px]"
              autoFocus
            />
            
            <div className="flex items-center justify-between p-3 border-t border-white/5">
              <div className="flex gap-2">
                 <button 
                   onClick={handleAIGenerateTitle}
                   disabled={!content || isGenerating}
                   className="p-2 rounded-full hover:bg-black/10 text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   title="Generate Title with AI"
                 >
                   <Sparkles size={18} />
                 </button>
                 {Object.values(NoteColor).slice(0, 5).map((c) => (
                    <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full border border-white/10 ${c} ${color === c ? 'ring-2 ring-white/50' : ''}`}
                    />
                 ))}
              </div>
              
              <button 
                onClick={handleClose}
                className="px-6 py-2 bg-neutral-900 hover:bg-neutral-950 text-zinc-200 font-medium rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateNote;