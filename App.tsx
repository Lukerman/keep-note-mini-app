import React, { useState, useEffect } from 'react';
import { Note, NoteColor, ViewMode } from './types';
import Sidebar from './components/Sidebar';
import CreateNote from './components/CreateNote';
import NoteCard from './components/NoteCard';
import { Search, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import * as GeminiService from './services/geminiService';
import { 
  fetchNotesFromSupabase, 
  createNoteInSupabase, 
  updateNoteInSupabase, 
  deleteNoteFromSupabase 
} from './services/supabaseClient';

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [view, setView] = useState<ViewMode>('notes');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  
  // User & Loading State
  const [userId, setUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTelegram, setIsTelegram] = useState(true);

  // Modal AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');

  // Initialize Telegram WebApp and Fetch Data
  useEffect(() => {
    // Check if running in Telegram
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      
      const user = tg.initDataUnsafe?.user;
      
      // Strict check: User must exist (valid Telegram Mini App session)
      if (user) {
        setUserId(user.id);
        setIsTelegram(true);
        fetchData(user.id);
      } else {
        // Telegram object exists (script loaded) but no user data (likely generic browser)
        console.warn("No Telegram user found. Access denied.");
        setIsTelegram(false);
        setIsLoading(false);
      }
    } else {
      // Telegram script not found or environment invalid
      console.warn("Telegram WebApp environment not detected.");
      setIsTelegram(false);
      setIsLoading(false);
    }
  }, []);

  const fetchData = async (uid: number) => {
    setIsLoading(true);
    try {
      const data = await fetchNotesFromSupabase(uid);
      setNotes(data);
    } catch (error) {
      console.error("Critical error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addNote = async (title: string, content: string, color: NoteColor) => {
    const newNote: Note = {
      id: crypto.randomUUID(), // Ensure secure random IDs
      title,
      content,
      color,
      isPinned: false,
      isArchived: false,
      isTrashed: false,
      labels: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    // Optimistic Update
    setNotes(prev => [newNote, ...prev]);

    // Persist to Supabase
    if (userId !== null) {
      await createNoteInSupabase(newNote, userId);
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    const timestamp = Date.now();
    const finalUpdates = { ...updates, updatedAt: timestamp };

    // Optimistic Update
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...finalUpdates } : n));
    if (selectedNote && selectedNote.id === id) {
        setSelectedNote(prev => prev ? { ...prev, ...finalUpdates } : null);
    }

    // Persist to Supabase
    await updateNoteInSupabase(id, finalUpdates);
  };

  const deleteNote = (id: string) => {
    updateNote(id, { isTrashed: true });
  };

  const restoreNote = (id: string) => {
    updateNote(id, { isTrashed: false });
  };

  const permanentlyDelete = async (id: string) => {
    // Optimistic Update
    setNotes(prev => prev.filter(n => n.id !== id));
    if (selectedNote?.id === id) setSelectedNote(null);

    // Persist to Supabase
    await deleteNoteFromSupabase(id);
  };

  const filteredNotes = notes.filter(note => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q)) && !note.isTrashed;
    }
    if (view === 'trash') return note.isTrashed;
    if (view === 'archive') return note.isArchived && !note.isTrashed;
    return !note.isArchived && !note.isTrashed;
  });

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const otherNotes = filteredNotes.filter(n => !n.isPinned);

  // Modal Handlers
  const openModal = (note: Note) => {
    setSelectedNote(note);
    setModalTitle(note.title);
    setModalContent(note.content);
  };

  const closeModal = () => {
    if (selectedNote) {
        if (selectedNote.title !== modalTitle || selectedNote.content !== modalContent) {
            updateNote(selectedNote.id, { title: modalTitle, content: modalContent });
        }
    }
    setSelectedNote(null);
  };

  // AI Actions in Modal
  const handleAIAction = async (action: 'summarize' | 'grammar' | 'elaborate') => {
    if (!modalContent) return;
    setAiLoading(true);
    let result: string | null = null;

    if (action === 'summarize') {
        result = await GeminiService.summarizeNote(modalContent);
    } else if (action === 'grammar') {
        result = await GeminiService.fixGrammar(modalContent);
    } else if (action === 'elaborate') {
        result = await GeminiService.elaborateNote(modalContent);
    }

    if (result) {
        setModalContent(result);
    }
    setAiLoading(false);
  };

  // 1. Check for Telegram Environment Logic
  if (!isTelegram) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center text-zinc-300">
        <div className="w-20 h-20 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-6 ring-1 ring-red-500/20">
          <AlertCircle size={40} />
        </div>
        <h1 className="text-3xl font-bold text-zinc-100 mb-4 tracking-tight">Access Denied</h1>
        <p className="max-w-md text-lg text-zinc-400 leading-relaxed">
          You are not open in Telegram mini app. 
          <br /><br />
          <span className="text-zinc-500 text-sm">Please open this app within Telegram to verify your identity and access your notes.</span>
        </p>
      </div>
    );
  }

  // 2. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-zinc-400">
        <Loader2 size={40} className="animate-spin mb-4 text-primary" />
        <p className="animate-pulse font-medium">Verifying Telegram ID...</p>
      </div>
    );
  }

  // 3. Main App Render
  return (
    <div className="min-h-screen bg-background text-zinc-100 font-sans">
      <Sidebar 
        currentView={view} 
        onChangeView={setView} 
        isOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
      />

      <div className={`transition-all duration-300 ${isSidebarOpen ? 'md:pl-72' : 'md:pl-72'}`}>
        
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center flex-1 max-w-2xl gap-4">
                <div className="relative w-full group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-zinc-500 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border-none rounded-lg leading-5 bg-neutral-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                </div>
            </div>
            <div className="ml-4 flex items-center gap-3">
                 {/* ID Display (Optional, for verification) */}
                 {userId && (
                    <span className="hidden md:block text-[10px] uppercase font-bold tracking-wider text-zinc-600 bg-zinc-900 px-2 py-1 rounded">
                      Linked to TG
                    </span>
                 )}
                 <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-xs font-bold shadow-lg shadow-primary/20">
                    MK
                 </div>
            </div>
        </header>

        <main className="p-4 md:p-8 max-w-7xl mx-auto min-h-[calc(100vh-80px)]">
          
          {view === 'notes' && !searchQuery && (
            <CreateNote onCreate={addNote} />
          )}

          {pinnedNotes.length > 0 && !searchQuery && view === 'notes' && (
            <div className="mb-8">
               <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 px-2">Pinned</h2>
               <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                  <AnimatePresence>
                     {pinnedNotes.map(note => (
                         <NoteCard 
                           key={note.id} 
                           note={note} 
                           onUpdate={updateNote} 
                           onDelete={deleteNote} 
                           onSelect={openModal}
                         />
                     ))}
                  </AnimatePresence>
               </div>
            </div>
          )}

          {pinnedNotes.length > 0 && otherNotes.length > 0 && !searchQuery && view === 'notes' && (
             <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 px-2 mt-8">Others</h2>
          )}

          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            <AnimatePresence mode='popLayout'>
              {otherNotes.map(note => (
                <NoteCard 
                  key={note.id} 
                  note={note} 
                  onUpdate={updateNote} 
                  onDelete={view === 'trash' ? permanentlyDelete : deleteNote} 
                  onSelect={openModal}
                  onRestore={view === 'trash' ? restoreNote : undefined}
                  onPermanentDelete={view === 'trash' ? permanentlyDelete : undefined}
                />
              ))}
            </AnimatePresence>
          </div>
          
          {otherNotes.length === 0 && pinnedNotes.length === 0 && (
             <div className="flex flex-col items-center justify-center mt-20 text-zinc-500">
                <Sparkles size={48} className="mb-4 opacity-20" />
                <p>No notes here yet</p>
             </div>
          )}

        </main>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {selectedNote && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div 
                   initial={{ opacity: 0 }} 
                   animate={{ opacity: 1 }} 
                   exit={{ opacity: 0 }}
                   onClick={closeModal}
                   className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div 
                   layoutId={`note-${selectedNote.id}`}
                   className={`relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl shadow-2xl ${selectedNote.color} border border-white/10 flex flex-col`}
                >
                   {aiLoading && (
                        <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-[2px] flex flex-col items-center justify-center text-white rounded-xl">
                            <Loader2 size={32} className="animate-spin mb-2" />
                            <span className="font-medium">AI is working magic...</span>
                        </div>
                   )}

                   <div className="p-6">
                        <input 
                            value={modalTitle}
                            onChange={(e) => setModalTitle(e.target.value)}
                            className="w-full bg-transparent text-2xl font-bold text-zinc-100 placeholder-zinc-400 mb-4 focus:outline-none"
                            placeholder="Title"
                        />
                        <textarea 
                            value={modalContent}
                            onChange={(e) => setModalContent(e.target.value)}
                            className="w-full min-h-[300px] bg-transparent text-zinc-200 placeholder-zinc-500 focus:outline-none resize-none leading-relaxed whitespace-pre-wrap"
                            placeholder="Note content"
                        />
                   </div>

                   <div className="sticky bottom-0 bg-black/10 backdrop-blur-md p-3 flex items-center justify-between border-t border-white/5">
                        <div className="flex gap-2">
                             <div className="group relative">
                                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface hover:bg-surfaceHover text-primary border border-primary/20 transition-all text-sm font-medium">
                                    <Sparkles size={16} />
                                    <span>AI Tools</span>
                                </button>
                                <div className="absolute bottom-full left-0 mb-2 w-48 bg-surface border border-neutral-700 rounded-lg shadow-xl overflow-hidden hidden group-hover:block">
                                    <button onClick={() => handleAIAction('grammar')} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-primary/20 hover:text-white transition-colors">
                                        Fix Grammar
                                    </button>
                                    <button onClick={() => handleAIAction('summarize')} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-primary/20 hover:text-white transition-colors">
                                        Summarize
                                    </button>
                                    <button onClick={() => handleAIAction('elaborate')} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-primary/20 hover:text-white transition-colors">
                                        Elaborate
                                    </button>
                                </div>
                             </div>
                             <button className="p-2 text-zinc-400 hover:text-zinc-100 rounded-full hover:bg-white/10" title="Color">
                                {/* Simple color toggle for demo or full palette reuse */}
                             </button>
                        </div>
                        <button 
                            onClick={closeModal}
                            className="px-6 py-1.5 bg-neutral-900 hover:bg-black text-white rounded-lg font-medium transition-colors"
                        >
                            Close
                        </button>
                   </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;