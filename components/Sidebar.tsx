import React from 'react';
import { Lightbulb, Archive, Trash2, Tag, Menu } from 'lucide-react';
import { ViewMode } from '../types';

interface SidebarProps {
  currentView: ViewMode;
  onChangeView: (view: ViewMode) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen, toggleSidebar }) => {
  const menuItems = [
    { id: 'notes', icon: Lightbulb, label: 'Notes' },
    { id: 'archive', icon: Archive, label: 'Archive' },
    { id: 'trash', icon: Trash2, label: 'Trash' },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-full hover:bg-surfaceHover text-zinc-200"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-surface border-r border-neutral-800 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center gap-3 p-6 mb-2">
            <div className="bg-primary/20 p-2 rounded-lg text-primary">
                <Lightbulb size={24} className="fill-current" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">MindKeep</h1>
        </div>

        <nav className="px-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id as ViewMode)}
                className={`w-full flex items-center gap-4 px-6 py-3.5 rounded-r-full text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary/20 text-primary' 
                    : 'text-zinc-400 hover:bg-surfaceHover hover:text-zinc-100'
                }`}
              >
                <Icon size={20} className={isActive ? 'fill-current' : ''} />
                <span>{item.label}</span>
              </button>
            );
          })}
          
          <div className="mt-8 px-6">
             <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Labels</h3>
             <div className="flex items-center gap-4 px-0 py-2 text-zinc-400 hover:text-zinc-100 cursor-pointer">
                <Tag size={18} />
                <span className="text-sm">Personal</span>
             </div>
             <div className="flex items-center gap-4 px-0 py-2 text-zinc-400 hover:text-zinc-100 cursor-pointer">
                <Tag size={18} />
                <span className="text-sm">Work</span>
             </div>
             <div className="flex items-center gap-4 px-0 py-2 text-zinc-400 hover:text-zinc-100 cursor-pointer">
                <Tag size={18} />
                <span className="text-sm">Ideas</span>
             </div>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;