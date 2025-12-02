import React, { useState, useRef, useEffect } from 'react';
import { NoteColor } from '../types';
import { Image, CheckSquare, Sparkles, X, Plus, Tag, Mic, Trash2 } from 'lucide-react';
import * as GeminiService from '../services/geminiService';

interface CreateNoteProps {
  onCreate: (title: string, content: string, color: NoteColor, labels: string[]) => void;
  initialMode?: 'text' | 'list' | 'image' | 'drawing' | 'audio';
  onClose?: () => void;
  isOpenExternal?: boolean;
}

const CreateNote: React.FC<CreateNoteProps> = ({ onCreate, initialMode = 'text', isOpenExternal, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(isOpenExternal || false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]); // Store images separately
  const [color, setColor] = useState<NoteColor>(NoteColor.DEFAULT);
  const [labels, setLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListMode, setIsListMode] = useState(initialMode === 'list');
  const [checklistItems, setChecklistItems] = useState<{text: string, checked: boolean}[]>([]);
  const [isListening, setIsListening] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync external open state
  useEffect(() => {
    if (isOpenExternal) {
        setIsExpanded(true);
        if (initialMode === 'list') setIsListMode(true);
        if (initialMode === 'image') setTimeout(() => fileInputRef.current?.click(), 100);
        if (initialMode === 'audio') startListening();
    }
  }, [isOpenExternal, initialMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Only close if empty, otherwise save
        if (title || content || checklistItems.length > 0 || images.length > 0) {
          handleClose();
        } else {
          setIsExpanded(false);
          if (onClose) onClose();
        }
      }
    };

    if (isExpanded) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, color, isExpanded, checklistItems, images]);

  const handleClose = () => {
    let finalContent = content;
    
    // 1. Convert checklist to markdown if in list mode
    if (isListMode && checklistItems.length > 0) {
        const listContent = checklistItems
            .filter(item => item.text.trim() !== '')
            .map(item => `- [${item.checked ? 'x' : ' '}] ${item.text}`)
            .join('\n');
        finalContent = finalContent ? finalContent + '\n' + listContent : listContent;
    }

    // 2. Append Images as Markdown
    if (images.length > 0) {
        const imageMarkdown = images.map(img => `\n![Image](${img})`).join('');
        finalContent = finalContent + imageMarkdown;
    }

    if (title.trim() || finalContent.trim()) {
      onCreate(title, finalContent, color, labels);
    }
    
    // Reset State
    setTitle('');
    setContent('');
    setImages([]);
    setChecklistItems([]);
    setLabels([]);
    setColor(NoteColor.DEFAULT);
    setIsExpanded(false);
    setIsListMode(false);
    if (onClose) onClose();
  };

  const handleAIGenerateTitle = async () => {
    const textToAnalyze = isListMode ? checklistItems.map(i => i.text).join(' ') : content;
    if (!textToAnalyze) return;
    
    setIsGenerating(true);
    const newTitle = await GeminiService.generateTitle(textToAnalyze);
    if (newTitle) setTitle(newTitle);
    setIsGenerating(false);
  };

  const addLabel = () => {
    if (newLabel.trim() && !labels.includes(newLabel.trim())) {
        setLabels([...labels, newLabel.trim()]);
        setNewLabel('');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setImages(prev => [...prev, base64]);
            setIsExpanded(true);
        };
        reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = ''; 
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        setIsListening(true);
        
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            if (isListMode) {
                setChecklistItems(prev => [...prev, { text: transcript, checked: false }]);
            } else {
                setContent(prev => prev + (prev ? ' ' : '') + transcript);
            }
            setIsListening(false);
        };
        
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        
        recognition.start();
    } else {
        alert("Speech recognition not supported in this browser.");
    }
  };

  // Checklist Helpers
  const addChecklistItem = () => {
    setChecklistItems([...checklistItems, { text: '', checked: false }]);
  };

  const updateChecklistItem = (index: number, text: string) => {
    const newItems = [...checklistItems];
    newItems[index].text = text;
    setChecklistItems(newItems);
  };

  const toggleChecklistItem = (index: number) => {
    const newItems = [...checklistItems];
    newItems[index].checked = !newItems[index].checked;
    setChecklistItems(newItems);
  };

  const removeChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-6 relative z-10 px-2 md:px-0">
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleImageUpload}
      />
      
      <div 
        ref={containerRef}
        className={`relative bg-surface transition-all duration-300 ease-out shadow-sm border border-separator/20 ${isExpanded ? 'rounded-xl ring-1 ring-black/5 dark:ring-white/5' : 'rounded-2xl hover:brightness-95 cursor-text'}`}
      >
        {!isExpanded ? (
          <div 
            onClick={() => setIsExpanded(true)}
            className="flex items-center justify-between p-4"
          >
            <span className="text-textSecondary font-medium text-lg">Take a note...</span>
            <div className="flex gap-4 text-textSecondary">
              <button onClick={(e) => { e.stopPropagation(); setIsExpanded(true); setIsListMode(true); }} className="hover:text-textMain"><CheckSquare size={22} /></button>
              <button onClick={(e) => { e.stopPropagation(); setIsExpanded(true); startListening(); }} className="hover:text-textMain"><Mic size={22} /></button>
              <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="hover:text-textMain"><Image size={22} /></button>
            </div>
          </div>
        ) : (
          <div className={`flex flex-col ${color.includes('bg-surface') ? '' : color} rounded-xl transition-colors duration-300`}>
            {isGenerating && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-20 flex items-center justify-center rounded-xl">
                    <div className="flex items-center gap-2 text-primary font-medium bg-surface px-4 py-2 rounded-full shadow-lg">
                        <Sparkles className="animate-spin" size={16} />
                        <span>AI Thinking...</span>
                    </div>
                </div>
            )}
            
            {/* Image Previews */}
            {images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto p-4 pb-0 no-scrollbar">
                    {images.map((img, idx) => (
                        <div key={idx} className="relative shrink-0 w-32 h-32 rounded-lg overflow-hidden border border-black/10 group">
                            <img src={img} alt="Preview" className="w-full h-full object-cover" />
                            <button 
                                onClick={() => removeImage(idx)}
                                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Title Input */}
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent text-textMain placeholder-textSecondary font-bold text-xl p-4 pb-2 focus:outline-none w-full"
            />

            {/* Content Area */}
            {isListMode ? (
                <div className="p-4 pt-0 space-y-2">
                    {checklistItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 group">
                            <button onClick={() => toggleChecklistItem(index)} className="text-textSecondary hover:text-primary">
                                {item.checked ? <CheckSquare size={18} className="text-textSecondary" /> : <div className="w-[18px] h-[18px] border-2 border-textSecondary rounded-sm" />}
                            </button>
                            <input 
                                value={item.text}
                                onChange={(e) => updateChecklistItem(index, e.target.value)}
                                className={`bg-transparent flex-1 focus:outline-none ${item.checked ? 'line-through text-textSecondary' : 'text-textMain'}`}
                                placeholder="List item"
                                autoFocus={index === checklistItems.length - 1}
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter') addChecklistItem();
                                    if(e.key === 'Backspace' && item.text === '') removeChecklistItem(index);
                                }}
                            />
                            <button onClick={() => removeChecklistItem(index)} className="opacity-0 group-hover:opacity-100 p-1 text-textSecondary hover:text-destructive transition-opacity">
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                    <button onClick={addChecklistItem} className="flex items-center gap-2 text-textSecondary hover:text-textMain mt-2 font-medium">
                        <Plus size={18} /> List item
                    </button>
                </div>
            ) : (
                <textarea
                  placeholder="Take a note..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="bg-transparent text-textMain placeholder-textSecondary p-4 pt-2 focus:outline-none resize-none min-h-[120px] leading-relaxed"
                  autoFocus
                />
            )}
            
            {/* Labels Display */}
            {labels.length > 0 && (
                <div className="px-4 pb-2 flex flex-wrap gap-1">
                    {labels.map(l => (
                        <span key={l} className="bg-black/5 dark:bg-white/10 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            {l}
                            <button onClick={() => setLabels(labels.filter(label => label !== l))} className="hover:text-destructive"><X size={12} /></button>
                        </span>
                    ))}
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-col gap-2 p-2 border-t border-black/5 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 overflow-x-auto no-scrollbar items-center">
                     <button 
                       onClick={handleAIGenerateTitle}
                       disabled={(!content && checklistItems.length === 0) || isGenerating}
                       className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-primary transition-colors disabled:opacity-50"
                       title="Generate Title"
                     >
                       <Sparkles size={18} />
                     </button>
                     
                     <button onClick={() => setIsListMode(!isListMode)} className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${isListMode ? 'text-primary' : 'text-textSecondary'}`}>
                         <CheckSquare size={18} />
                     </button>
                     
                     <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-textSecondary transition-colors">
                         <Image size={18} />
                     </button>

                     <button onClick={startListening} className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${isListening ? 'text-destructive animate-pulse' : 'text-textSecondary'}`}>
                         <Mic size={18} />
                     </button>

                     {/* Color Palette */}
                     {Object.values(NoteColor).slice(0, 5).map((c) => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            className={`w-5 h-5 rounded-full border border-black/10 dark:border-white/10 mx-0.5 ${c.split(' ')[0]} ${color === c ? 'ring-2 ring-primary ring-offset-1 ring-offset-surface' : ''}`}
                        />
                     ))}
                  </div>
                  
                  <button 
                    onClick={handleClose}
                    className="px-6 py-1.5 bg-primary text-primaryText font-medium rounded-lg transition-colors hover:brightness-110 shadow-sm"
                  >
                    Save
                  </button>
                </div>
                
                {/* Label Input */}
                <div className="flex items-center gap-2 px-2 mt-1">
                    <Tag size={14} className="text-textSecondary" />
                    <input 
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addLabel()}
                        placeholder="Add label..."
                        className="bg-transparent text-sm focus:outline-none flex-1 text-textMain placeholder-textSecondary/50"
                    />
                    {newLabel && <button onClick={addLabel} className="text-xs text-primary font-medium">Add</button>}
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateNote;