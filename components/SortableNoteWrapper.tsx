import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import NoteCard from './NoteCard';
import { Note } from '../types';

interface SortableNoteWrapperProps {
  note: Note;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onSelect: (note: Note) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  disabled?: boolean;
}

const SortableNoteWrapper: React.FC<SortableNoteWrapperProps> = ({
  note,
  onUpdate,
  onDelete,
  onSelect,
  onRestore,
  onPermanentDelete,
  disabled
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: note.id,
    disabled: disabled
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.3 : 1,
    touchAction: 'none' // Important for preventing scrolling while dragging
  };

  return (
    <div 
        ref={setNodeRef} 
        style={style} 
        {...attributes} 
        {...listeners}
        className="h-full" // Ensure wrapper fills grid cell
    >
      <div className="h-full">
         <NoteCard
            note={note}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onSelect={onSelect}
            onRestore={onRestore}
            onPermanentDelete={onPermanentDelete}
         />
      </div>
    </div>
  );
};

export default SortableNoteWrapper;