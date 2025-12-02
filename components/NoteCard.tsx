import React from 'react';
import { Note, NoteColor } from '../types';
import { Pin, Archive, Trash2, RotateCcw, Copy, MoreVertical, Palette } from 'lucide-react';
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

  return (
    <motion.div
      layoutId={`note-${note.id}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={() => onSelect(note)}
      className={`relative group rounded-xl p-4 mb-4 border border-white/5 hover:border-white/10 shadow-sm hover:shadow-md transition-all duration-200 cursor-default ${note.color} text-zinc-100 break-inside-avoid`}
    >
      <div className="flex justify-between items-start mb-2 gap-2">
        {note.title && (
          <h3 className="font-semibold text-lg leading-tight break-words w-full">
            {note.title}
          </h3>
        )}
        {!note.isTrashed && (
           <button 
             onClick={(e) => handleAction(e, () => onUpdate(note.id, { isPinned: !note.isPinned }))}
             className={`opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-black/20 ${note.isPinned ? 'opacity-100 text-primary' : 'text-zinc-400'}`}
           >
             <Pin size={18} className={note.isPinned ? 'fill-current' : ''} />
           </button>
        )}
      </div>

      <p className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed min-h-[1.5rem] break-words">
        {note.content}
      </p>

      {note.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {note.labels.map(label => (
            <span key={label} className="px-2 py-0.5 rounded-md bg-black/20 text-xs text-zinc-300">
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Hover Actions */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-between mt-4 pt-2 border-t border-black/5">
        <div className="flex gap-1">
          {note.isTrashed ? (
            <>
              <button 
                onClick={(e) => handleAction(e, () => onRestore && onRestore(note.id))}
                className="p-2 rounded-full hover:bg-black/20 text-zinc-300 hover:text-white"
                title="Restore"
              >
                <RotateCcw size={16} />
              </button>
              <button 
                onClick={(e) => handleAction(e, () => onPermanentDelete && onPermanentDelete(note.id))}
                className="p-2 rounded-full hover:bg-black/20 text-zinc-300 hover:text-red-400"
                title="Delete Forever"
              >
                <Trash2 size={16} />
              </button>
            </>
          ) : (
            <>
              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowPalette(!showPalette); }}
                  className="p-2 rounded-full hover:bg-black/20 text-zinc-300 hover:text-white"
                  title="Change Color"
                >
                  <Palette size={16} />
                </button>
                {showPalette && (
                  <div className="absolute bottom-full left-0 mb-2 p-2 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl flex gap-1 z-20 w-max"
                       onMouseLeave={() => setShowPalette(false)}>
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        onClick={(e) => handleColorChange(e, color)}
                        className={`w-5 h-5 rounded-full border border-white/10 ${color} hover:scale-110 transition-transform`}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              <button 
                onClick={(e) => handleAction(e, () => onUpdate(note.id, { isArchived: !note.isArchived }))}
                className="p-2 rounded-full hover:bg-black/20 text-zinc-300 hover:text-white"
                title={note.isArchived ? "Unarchive" : "Archive"}
              >
                <Archive size={16} />
              </button>
              
              <button 
                onClick={(e) => handleAction(e, () => onDelete(note.id))}
                className="p-2 rounded-full hover:bg-black/20 text-zinc-300 hover:text-white"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default NoteCard;