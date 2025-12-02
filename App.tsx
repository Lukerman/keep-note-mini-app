import React, { useState, useEffect, useMemo } from 'react';
import { Note, NoteColor, ViewMode, ThemePreference } from './types';
import Sidebar from './components/Sidebar';
import CreateNote from './components/CreateNote';
import NoteCard from './components/NoteCard';
import SortableNoteWrapper from './components/SortableNoteWrapper';
import FabMenu from './components/FabMenu';
import { Search, Loader2, AlertCircle, Cloud, Menu, ChevronLeft, Pin, Archive, Trash2, Palette, Clock, CheckSquare, Image as ImageIcon, Tag, X, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  fetchNotesFromSupabase, 
  createNoteInSupabase, 
  updateNoteInSupabase, 
  deleteNoteFromSupabase,
  updateNotesOrder
} from './services/supabaseClient';

// DND Kit Imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragEndEvent,
  TouchSensor,
  MouseSensor
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

export const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [view, setView] = useState<ViewMode>('notes');
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Selection / Editing State
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalLabels, setModalLabels] = useState<string[]>([]);
  const [newModalLabel, setNewModalLabel] = useState('');
  const [showModalPalette, setShowModalPalette] = useState(false);
  
  // Modal Checklist State
  const [isModalListMode, setIsModalListMode] = useState(false);
  const [modalChecklistItems, setModalChecklistItems] = useState<{text: string, checked: boolean}[]>([]);
  
  // Create Note State via FAB
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState<'text' | 'list' | 'image' | 'drawing' | 'audio'>('text');

  // User & Loading State
  const [userId, setUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTelegram, setIsTelegram] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Theme State
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');

  // DND State
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts to allow clicks
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 1. Initialize & Auth
  useEffect(() => {
    const initApp = async () => {
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
      
      if (tgUser) {
        setUserId(tgUser.id);
        setIsTelegram(true);
        window.Telegram.WebApp.expand();
        window.Telegram.WebApp.ready();
      } else {
        setIsTelegram(false);
        setUserId(123456); 
      }
    };
    initApp();
  }, []);

  // 2. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      try {
        setIsLoading(true);
        const fetchedNotes = await fetchNotesFromSupabase(userId);
        setNotes(fetchedNotes);
      } catch (error) {
        console.error("Failed to load notes", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  // 3. Theme Handling
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme_pref') as ThemePreference;
    if (savedTheme) setThemePreference(savedTheme);
  }, []);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const systemScheme = tg?.colorScheme || 'light';
    const effectiveTheme = themePreference === 'system' ? systemScheme : themePreference;

    const root = document.documentElement;
    if (effectiveTheme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }

    root.classList.remove('force-dark', 'force-light');
    if (themePreference === 'dark') root.classList.add('force-dark');
    else if (themePreference === 'light') root.classList.add('force-light');

    if (tg) {
        let headerColor = '#ffffff';
        if (themePreference === 'dark' || (themePreference === 'system' && systemScheme === 'dark')) {
            headerColor = '#18181b'; 
        }
        tg.setHeaderColor(headerColor);
        tg.setBackgroundColor(headerColor);
    }
  }, [themePreference]);

  const handleThemeChange = (newTheme: ThemePreference) => {
    setThemePreference(newTheme);
    localStorage.setItem('theme_pref', newTheme);
  };

  // --- CRUD Operations ---

  const handleCreateNote = async (title: string, content: string, color: NoteColor, labels: string[]) => {
    if (!userId) return;
    setSaveStatus('saving');
    
    // Put new note at the beginning of the list logic (lowest orderIndex or unshifted)
    // For simplicity, we assign it orderIndex 0 and we might need to shift others, 
    // or just let it float.
    const minIndex = notes.length > 0 ? Math.min(...notes.map(n => n.orderIndex || 0)) : 0;
    
    const newNote: Note = {
      id: crypto.randomUUID(),
      title,
      content,
      isPinned: false,
      isArchived: false,
      isTrashed: false,
      labels,
      color,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      orderIndex: minIndex - 1, // Ensure it's at the top
    };

    setNotes(prev => [newNote, ...prev]);
    setIsCreateModalOpen(false); 

    await createNoteInSupabase(newNote, userId);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('saved'), 2000); 
  };

  const handleUpdateNote = async (id: string, updates: Partial<Note>) => {
    if (!userId) return;
    setSaveStatus('saving');

    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n));
    
    if (selectedNote && selectedNote.id === id) {
        setSelectedNote(prev => prev ? { ...prev, ...updates } : null);
    }

    await updateNoteInSupabase(id, updates);
    setSaveStatus('saved');
  };

  const handleDeleteNote = async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    if (note.isTrashed) {
        setNotes(prev => prev.filter(n => n.id !== id));
        if (selectedNote?.id === id) setSelectedNote(null);
        await deleteNoteFromSupabase(id);
    } else {
        handleUpdateNote(id, { isTrashed: true });
        if (selectedNote?.id === id) setSelectedNote(null);
    }
  };

  const handleRestoreNote = (id: string) => {
    handleUpdateNote(id, { isTrashed: false });
  };

  // --- Drag and Drop Logic ---

  const handleDragStart = (event: any) => {
    setActiveDragId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveDragId(null);

    if (over && active.id !== over.id) {
      setNotes((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Persist the new order by updating orderIndex for the affected slice
        // To be safe and simple, we update indices for the whole list based on array position
        const updates = newItems.map((note, index) => ({
            id: note.id,
            orderIndex: index
        }));

        // Fire and forget update
        updateNotesOrder(updates);

        return newItems;
      });
    }
  };

  // --- Modal Logic ---
  // (Kept same as before)
  const openNoteModal = (note: Note) => {
    setSelectedNote(note);
    setModalTitle(note.title);
    setModalLabels(note.labels || []);
    
    const imageRegex = /!\[.*?\]\((data:image\/.*?;base64,.*?)\)/g;
    const extractedImages: string[] = [];
    
    let cleanContent = note.content.replace(imageRegex, (match, dataUrl) => {
        extractedImages.push(dataUrl);
        return ''; 
    }).trim();

    const lines = cleanContent.split('\n');
    const hasChecklist = lines.length > 0 && lines.some(l => /^- \[[ x]\] /.test(l));

    if (hasChecklist) {
        setIsModalListMode(true);
        const items = lines
            .filter(l => l.trim() !== '')
            .map(line => {
                const match = line.match(/^- \[([ x])\] (.*)/);
                if (match) {
                    return { checked: match[1] === 'x', text: match[2] };
                }
                return { checked: false, text: line };
            });
        setModalChecklistItems(items);
        setModalContent(''); 
    } else {
        setIsModalListMode(false);
        setModalChecklistItems([]);
        setModalContent(cleanContent);
    }

    setModalImages(extractedImages);
    setShowModalPalette(false);
    
    window.history.pushState({ noteId: note.id }, '');
  };

  const closeNoteModal = () => {
    if (selectedNote) {
        let finalContent = modalContent;
        if (isModalListMode) {
             finalContent = modalChecklistItems
                .map(item => `- [${item.checked ? 'x' : ' '}] ${item.text}`)
                .join('\n');
        }
        modalImages.forEach(img => {
            finalContent += `\n![Image](${img})`;
        });

        if (selectedNote.title !== modalTitle || selectedNote.content !== finalContent || JSON.stringify(selectedNote.labels) !== JSON.stringify(modalLabels)) {
            handleUpdateNote(selectedNote.id, { 
                title: modalTitle, 
                content: finalContent,
                labels: modalLabels
            });
        }
    }
    setSelectedNote(null);
    setModalImages([]);
    setModalLabels([]);
    setIsModalListMode(false);
    setModalChecklistItems([]);
    if (window.history.state?.noteId) {
        window.history.back();
    }
  };

  useEffect(() => {
    const handlePopState = () => {
        if (selectedNote) setSelectedNote(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedNote]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedNote) {
         let fullContentForSave = modalContent;
         if (isModalListMode) {
             fullContentForSave = modalChecklistItems
                .map(item => `- [${item.checked ? 'x' : ' '}] ${item.text}`)
                .join('\n');
         }
         fullContentForSave += modalImages.map(img => `\n![Image](${img})`).join('');
         if (selectedNote.title !== modalTitle || selectedNote.content !== fullContentForSave) {
            handleUpdateNote(selectedNote.id, { title: modalTitle, content: fullContentForSave });
         }
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [modalTitle, modalContent, modalImages, modalChecklistItems, isModalListMode]); 

  const handleFabAction = (action: 'text' | 'list' | 'image' | 'drawing' | 'audio') => {
    setCreateMode(action);
    setIsCreateModalOpen(true);
  };

  const handleAddModalLabel = () => {
     if(newModalLabel.trim() && !modalLabels.includes(newModalLabel.trim())) {
         const updatedLabels = [...modalLabels, newModalLabel.trim()];
         setModalLabels(updatedLabels);
         handleUpdateNote(selectedNote!.id, { labels: updatedLabels });
         setNewModalLabel('');
     }
  };

  const addModalChecklistItem = () => { setModalChecklistItems([...modalChecklistItems, { text: '', checked: false }]); };
  const updateModalChecklistItem = (index: number, text: string) => { const newItems = [...modalChecklistItems]; newItems[index].text = text; setModalChecklistItems(newItems); };
  const toggleModalChecklistItem = (index: number) => { const newItems = [...modalChecklistItems]; newItems[index].checked = !newItems[index].checked; setModalChecklistItems(newItems); };
  const removeModalChecklistItem = (index: number) => { setModalChecklistItems(modalChecklistItems.filter((_, i) => i !== index)); };


  // --- Filtering ---
  const filteredNotes = notes.filter(note => {
    const matchesSearch = (note.title + note.content).toLowerCase().includes(searchQuery.toLowerCase());
    let matchesView = true;
    if (selectedLabel) {
        matchesView = (note.labels && note.labels.includes(selectedLabel)) && !note.isTrashed;
    } else {
        matchesView = 
          view === 'notes' ? (!note.isArchived && !note.isTrashed) :
          view === 'archive' ? note.isArchived :
          view === 'trash' ? note.isTrashed : true;
    }
    return matchesSearch && matchesView;
  });

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const otherNotes = filteredNotes.filter(n => !n.isPinned);
  const draggedNote = notes.find(n => n.id === activeDragId);

  // Note Grid Component with DND
  const SortableNoteGrid = ({ items, idPrefix }: { items: Note[], idPrefix: string }) => (
    <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
    >
        <SortableContext items={items.map(n => n.id)} strategy={rectSortingStrategy}>
            {/* Switched to Grid Layout for reliable Drag and Drop. Masonry DND is extremely complex without absolute positioning */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-4">
                {items.map(note => (
                    <SortableNoteWrapper 
                        key={note.id} 
                        note={note} 
                        onUpdate={handleUpdateNote} 
                        onDelete={handleDeleteNote}
                        onSelect={openNoteModal}
                        onRestore={handleRestoreNote}
                        onPermanentDelete={handleDeleteNote}
                        disabled={view !== 'notes' || !!selectedLabel} // Disable DND in trash/archive or when filtering
                    />
                ))}
            </div>
        </SortableContext>
        
        <DragOverlay>
            {draggedNote ? (
                 <div className="opacity-90 scale-105 shadow-2xl">
                     <NoteCard 
                        note={draggedNote} 
                        onUpdate={() => {}} 
                        onDelete={() => {}} 
                        onSelect={() => {}}
                     />
                 </div>
            ) : null}
        </DragOverlay>
    </DndContext>
  );

  if (!isTelegram && userId === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-textMain p-4 text-center">
        <div>
           <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
           <h1 className="text-xl font-bold mb-2">Access Denied</h1>
           <p className="text-textSecondary">Please open this app via Telegram.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-textMain font-sans transition-colors duration-300">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-separator px-4 py-3 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3 w-full">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-full hover:bg-surface text-textSecondary hover:text-textMain">
            <Menu size={24} />
          </button>
          
          <div className="flex-1 max-w-xl mx-auto relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search size={18} className="text-textSecondary group-focus-within:text-primary transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Search Keep" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface text-textMain rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder-textSecondary"
            />
          </div>

          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-bold shadow-md shrink-0">
             {userId ? 'U' : 'G'}
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(false)}
        currentView={view}
        onChangeView={setView}
        themePreference={themePreference}
        onThemeChange={handleThemeChange}
        labels={Array.from(new Set(notes.flatMap(n => n.labels || [])))}
        selectedLabel={selectedLabel}
        onSelectLabel={setSelectedLabel}
      />

      {/* Main Content */}
      <main className="p-4 pb-24 max-w-7xl mx-auto min-h-[calc(100vh-80px)]">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <>
            {selectedLabel && (
                <div className="flex items-center gap-2 mb-4 px-2">
                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                        <Tag size={20} />
                    </div>
                    <span className="text-xl font-bold">{selectedLabel}</span>
                    <button onClick={() => setSelectedLabel(null)} className="ml-auto text-sm text-primary hover:underline">
                        Clear filter
                    </button>
                </div>
            )}

            <div className="hidden md:block">
                 <CreateNote onCreate={handleCreateNote} />
            </div>

            {filteredNotes.length === 0 && (
                <div className="flex flex-col items-center justify-center mt-20 text-textSecondary opacity-60">
                    <Cloud size={64} strokeWidth={1} />
                    <p className="mt-4 text-lg">
                        {selectedLabel ? `No notes with label "${selectedLabel}"` : 'No notes here yet'}
                    </p>
                </div>
            )}

            {/* We render dragged notes via DND only in main view to avoid sorting confusion */}
            {pinnedNotes.length > 0 && (
              <div className="mb-8">
                <h6 className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-3 px-2">Pinned</h6>
                <SortableNoteGrid items={pinnedNotes} idPrefix="pinned" />
              </div>
            )}

            {otherNotes.length > 0 && (
              <div>
                {pinnedNotes.length > 0 && <h6 className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-3 px-2">Others</h6>}
                <SortableNoteGrid items={otherNotes} idPrefix="others" />
              </div>
            )}
          </>
        )}
      </main>

      <FabMenu onAction={handleFabAction} />

      {/* Create Modal */}
      <AnimatePresence>
         {isCreateModalOpen && (
             <motion.div 
                initial={{ opacity: 0, y: '100%' }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: '100%' }}
                className="fixed inset-0 z-[60] bg-background flex flex-col"
             >
                <div className="flex-1 overflow-y-auto p-4 pt-10">
                   <CreateNote 
                      onCreate={handleCreateNote} 
                      initialMode={createMode} 
                      onClose={() => setIsCreateModalOpen(false)}
                      isOpenExternal={true}
                   />
                </div>
             </motion.div>
         )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {selectedNote && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-0 md:p-6"
            onClick={closeNoteModal}
          >
            <div 
                className={`w-full md:max-w-3xl h-full md:h-auto md:max-h-[85vh] ${selectedNote.color.includes('bg-surface') ? 'bg-background' : selectedNote.color} md:rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-colors duration-300 relative`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5 bg-transparent">
                    <button onClick={closeNoteModal} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-textMain">
                        <ChevronLeft size={24} />
                    </button>
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => setIsModalListMode(!isModalListMode)} 
                            className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 ${isModalListMode ? 'text-primary' : 'text-textSecondary'}`}
                            title="Toggle List Mode"
                        >
                            <CheckSquare size={20} />
                        </button>
                        <button 
                            onClick={() => handleUpdateNote(selectedNote.id, { isPinned: !selectedNote.isPinned })}
                            className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 ${selectedNote.isPinned ? 'text-primary fill-current' : 'text-textSecondary'}`}
                        >
                            <Pin size={20} className={selectedNote.isPinned ? 'fill-current' : ''} />
                        </button>
                        <button 
                            onClick={() => { handleUpdateNote(selectedNote.id, { isArchived: !selectedNote.isArchived }); closeNoteModal(); }}
                            className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 ${selectedNote.isArchived ? 'text-primary' : 'text-textSecondary'}`}
                        >
                            <Archive size={20} />
                        </button>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
                    <input 
                        value={modalTitle}
                        onChange={(e) => setModalTitle(e.target.value)}
                        placeholder="Title"
                        className="w-full bg-transparent text-2xl font-bold text-textMain placeholder-textSecondary/50 mb-4 focus:outline-none"
                    />
                    
                    <div className="space-y-4 mb-4">
                        {modalImages.map((img, idx) => (
                            <div key={idx} className="relative group rounded-xl overflow-hidden shadow-sm">
                                <img src={img} alt="Attachment" className="w-full h-auto max-h-96 object-contain bg-black/5 dark:bg-white/5" />
                                <button 
                                    onClick={() => setModalImages(prev => prev.filter((_, i) => i !== idx))}
                                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {isModalListMode ? (
                        <div className="space-y-2">
                             {modalChecklistItems.map((item, index) => (
                                <div key={index} className="flex items-center gap-2 group">
                                    <button onClick={() => toggleModalChecklistItem(index)} className="text-textSecondary hover:text-primary">
                                        {item.checked ? <CheckSquare size={20} className="text-textSecondary" /> : <div className="w-[20px] h-[20px] border-2 border-textSecondary rounded-sm" />}
                                    </button>
                                    <input 
                                        value={item.text}
                                        onChange={(e) => updateModalChecklistItem(index, e.target.value)}
                                        className={`bg-transparent flex-1 focus:outline-none text-lg ${item.checked ? 'line-through text-textSecondary' : 'text-textMain'}`}
                                        placeholder="List item"
                                        onKeyDown={(e) => {
                                            if(e.key === 'Enter') addModalChecklistItem();
                                            if(e.key === 'Backspace' && item.text === '') removeModalChecklistItem(index);
                                        }}
                                    />
                                    <button onClick={() => removeModalChecklistItem(index)} className="opacity-0 group-hover:opacity-100 p-1 text-textSecondary hover:text-destructive transition-opacity">
                                        <X size={18} />
                                    </button>
                                </div>
                            ))}
                            <button onClick={addModalChecklistItem} className="flex items-center gap-2 text-textSecondary hover:text-textMain mt-3 font-medium">
                                <Plus size={20} /> List item
                            </button>
                        </div>
                    ) : (
                        <textarea 
                            value={modalContent}
                            onChange={(e) => setModalContent(e.target.value)}
                            placeholder="Note"
                            className="w-full bg-transparent text-lg text-textMain placeholder-textSecondary/50 resize-none focus:outline-none min-h-[40vh] leading-relaxed"
                        />
                    )}
                    
                    <div className="mt-8 flex flex-wrap gap-2 items-center">
                        {modalLabels.map(label => (
                            <span key={label} className="px-3 py-1 bg-black/5 dark:bg-white/10 rounded-full text-sm flex items-center gap-1 group">
                                {label}
                                <button onClick={() => {
                                    const newLabels = modalLabels.filter(l => l !== label);
                                    setModalLabels(newLabels);
                                    handleUpdateNote(selectedNote.id, { labels: newLabels });
                                }} className="hover:text-destructive"><X size={14}/></button>
                            </span>
                        ))}
                        <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-2 py-1 rounded-full">
                            <Plus size={14} className="text-textSecondary" />
                            <input 
                                className="bg-transparent focus:outline-none text-sm w-20"
                                placeholder="Add label"
                                value={newModalLabel}
                                onChange={e => setNewModalLabel(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddModalLabel()}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-3 bg-surface/50 border-t border-separator backdrop-blur-md flex items-center justify-between text-textSecondary text-sm">
                    <div className="relative">
                        <button 
                            onClick={() => setShowModalPalette(!showModalPalette)}
                            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-textMain"
                        >
                            <Palette size={20} />
                        </button>
                        {showModalPalette && (
                            <div className="absolute bottom-full left-0 mb-4 ml-[-8px] p-3 bg-surface border border-separator rounded-2xl shadow-xl grid grid-cols-5 gap-2 w-[180px]">
                                {Object.values(NoteColor).map(c => (
                                    <button
                                        key={c}
                                        onClick={() => {
                                            handleUpdateNote(selectedNote.id, { color: c });
                                            setShowModalPalette(false);
                                        }}
                                        className={`w-6 h-6 rounded-full border border-black/10 dark:border-white/10 ${c.split(' ')[0]} ${selectedNote.color === c ? 'ring-2 ring-primary' : ''}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 opacity-60">
                        {saveStatus === 'saving' ? (
                            <span className="animate-pulse">Saving...</span>
                        ) : (
                            <>
                                <Clock size={12} />
                                <span className="text-xs">
                                    Edited {new Date(selectedNote.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                         <button 
                            onClick={() => { handleDeleteNote(selectedNote.id); closeNoteModal(); }}
                            className="p-2 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};