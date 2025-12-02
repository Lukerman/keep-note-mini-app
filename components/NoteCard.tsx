import React from 'react';
import { Note, NoteColor } from '../types';
import { Pin, Archive, Trash2, RotateCcw, Palette, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';

interface NoteCardProps {
  note: Note;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onSelect: (note: Note) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ 
  note, 
  onUpdate, 
  onDelete, 
  onSelect,
  onRestore,
  onPermanentDelete
}) => {
  const [showPalette, setShowPalette] = React.useState(false);

  const handleColorChange = (e: React.MouseEvent, color: NoteColor) => {
    e.stopPropagation();
    onUpdate(note.id, { color });
    setShowPalette(false);
  };

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const colorOptions = Object.values(NoteColor);

  // Helper to render content with Markdown detection (Simple)
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    // Limit preview lines for cleaner UI
    const previewLines = lines.slice(0, 8); 
    
    return previewLines.map((line, i) => {
        // Render Images
        const imgMatch = line.match(/!\[.*?\]\((.*?)\)/);
        if (imgMatch) {
            return (
                <div key={i} className="my-2 rounded-lg overflow-hidden border border-black/5 dark:border-white/5 relative h-32 bg-gray-100 dark:bg-zinc-800">
                    <img src={imgMatch[1]} alt="Note attachment" className="w-full h-full object-cover" loading="lazy" />
                </div>
            );
        }

        // Render Checkboxes
        const checkboxMatch = line.match(/^-\s\[([ x])\]\s(.*)/);
        if (checkboxMatch) {
            const isChecked = checkboxMatch[1] === 'x';
            const text = checkboxMatch[2];
            return (
                <div key={i} className="flex items-start gap-2 py-0.5">
                    <div className={`mt-1 min-w-[14px] h-[14px] rounded-sm border ${isChecked ? 'bg-primary border-primary' : 'border-textSecondary'}`}>
                         {isChecked && <svg className="w-full h-full text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    </div>
                    <span className={`text-sm ${isChecked ? 'line-through text-textSecondary' : 'text-textMain'} truncate w-full`}>{text}</span>
                </div>
            );
        }

        // Regular Text
        if (line.trim() === '') return <br key={i} />;
        return <p key={i} className="text-sm text-textMain whitespace-pre-wrap break-words line-clamp-3">{line}</p>;
    });
  };

  return (
    <motion.div
      layoutId={`note-${note.id}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={() => onSelect(note)}
      className={`relative group rounded-xl p-4 mb-4 border border-transparent shadow-sm hover:shadow-md transition-all duration-200 cursor-default ${note.color} break-inside-avoid`}
    >
      <div className="flex justify-between items-start mb-2 gap-2">
        {note.title && (
          <h3 className="font-semibold text-lg leading-tight break-words w-full text-textMain">
            {note.title}
          </h3>
        )}
        {!note.isTrashed && (
           <button 
             onClick={(e) => handleAction(e, () => onUpdate(note.id, { isPinned: !note.isPinned }))}
             className={`p-2 -mr-2 -mt-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${note.isPinned ? 'text-primary' : 'text-textSecondary/50'}`}
           >
             <Pin size={18} className={note.isPinned ? 'fill-current' : ''} />
           </button>
        )}
      </div>

      <div className="leading-relaxed min-h-[1.5rem]">
        {renderContent(note.content)}
      </div>

      {note.labels && note.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3 mb-1">
          {note.labels.map(label => (
            <span key={label} className="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-[10px] text-textSecondary font-medium uppercase tracking-wider">
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Action Footer - Always visible on mobile, fades in on desktop */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/5 dark:border-white/5 opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
        <div className="flex gap-1 -ml-2">
          {note.isTrashed ? (
            <>
              <button 
                onClick={(e) => handleAction(e, () => onRestore && onRestore(note.id))}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-textSecondary hover:text-textMain"
                title="Restore"
              >
                <RotateCcw size={18} />
              </button>
              <button 
                onClick={(e) => handleAction(e, () => onPermanentDelete && onPermanentDelete(note.id))}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-textSecondary hover:text-destructive"
                title="Delete Forever"
              >
                <Trash2 size={18} />
              </button>
            </>
          ) : (
            <>
              {/* Color Button */}
              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowPalette(!showPalette); }}
                  className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-textSecondary hover:text-textMain"
                  title="Change Color"
                >
                  <Palette size={18} />
                </button>
                {showPalette && (
                  <div className="absolute bottom-full left-0 mb-2 p-2 bg-surface border border-separator rounded-xl shadow-xl flex gap-1 z-20 w-max"
                       onClick={(e) => e.stopPropagation()}
                       onMouseLeave={() => setShowPalette(false)}>
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        onClick={(e) => handleColorChange(e, color)}
                        className={`w-6 h-6 rounded-full border border-black/10 dark:border-white/10 ${color.split(' ')[0]} hover:scale-110 transition-transform ${note.color === color ? 'ring-2 ring-primary' : ''}`}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              <button 
                onClick={(e) => handleAction(e, () => onUpdate(note.id, { isArchived: !note.isArchived }))}
                className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${note.isArchived ? 'text-primary' : 'text-textSecondary hover:text-textMain'}`}
                title={note.isArchived ? "Unarchive" : "Archive"}
              >
                <Archive size={18} />
              </button>
              
              <button 
                onClick={(e) => handleAction(e, () => onDelete(note.id))}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-textSecondary hover:text-destructive transition-colors"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default NoteCard;