import React from 'react';
import { Lightbulb, Archive, Trash2, Tag, X, Sun, Moon, Smartphone, Edit2 } from 'lucide-react';
import { ViewMode, ThemePreference } from '../types';

interface SidebarProps {
  currentView: ViewMode;
  onChangeView: (view: ViewMode) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  themePreference: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  labels?: string[];
  selectedLabel?: string | null;
  onSelectLabel?: (label: string | null) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onChangeView, 
  isOpen, 
  toggleSidebar, 
  themePreference, 
  onThemeChange,
  labels = [],
  selectedLabel,
  onSelectLabel
}) => {
  const menuItems = [
    { id: 'notes', icon: Lightbulb, label: 'Notes' },
    { id: 'archive', icon: Archive, label: 'Archive' },
    { id: 'trash', icon: Trash2, label: 'Trash' },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          onClick={toggleSidebar} 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-separator transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-4 mb-2 border-b border-separator/50">
             <div className="flex items-center gap-3">
                <div className="bg-primary p-1.5 rounded-lg text-primaryText shadow-sm">
                    <Lightbulb size={20} className="fill-current" />
                </div>
                <h1 className="text-xl font-bold text-textMain tracking-tight">MindKeep</h1>
            </div>
            <button onClick={toggleSidebar} className="md:hidden text-textSecondary p-1 hover:bg-surface rounded-full transition-colors">
                <X size={24} />
            </button>
        </div>

        <nav className="p-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id && !selectedLabel;
            return (
              <button
                key={item.id}
                onClick={() => { 
                    onChangeView(item.id as ViewMode); 
                    if(onSelectLabel) onSelectLabel(null); // Clear label filter
                    toggleSidebar(); 
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-textMain hover:bg-surface'
                }`}
              >
                <Icon size={20} className={isActive ? 'fill-current' : ''} />
                <span>{item.label}</span>
              </button>
            );
          })}
          
          <div className="my-4 border-t border-separator/50 mx-4" />

          <div className="px-4">
             <div className="flex items-center justify-between mb-2">
                 <h3 className="text-xs font-bold text-textSecondary uppercase tracking-wider">Labels</h3>
                 <button className="text-textSecondary hover:text-primary transition-colors p-1" title="Edit labels">
                     <Edit2 size={12} />
                 </button>
             </div>
             <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                {labels.length > 0 ? labels.map(label => {
                     const isLabelActive = selectedLabel === label;
                     return (
                        <button 
                            key={label} 
                            onClick={() => {
                                if(onSelectLabel) onSelectLabel(label);
                                onChangeView('notes'); // Switch to notes view when filtering by label
                                toggleSidebar();
                            }}
                            className={`w-full flex items-center gap-4 px-2 py-2 rounded-lg cursor-pointer transition-colors group ${isLabelActive ? 'bg-primary/10 text-primary' : 'text-textMain hover:bg-surface'}`}
                        >
                            <Tag size={18} className={isLabelActive ? 'text-primary fill-current' : 'text-textSecondary group-hover:text-textMain'} />
                            <span className="text-sm font-medium truncate">{label}</span>
                        </button>
                     );
                }) : (
                    <div className="text-xs text-textSecondary italic px-2">No labels yet</div>
                )}
             </div>
          </div>
        </nav>
        
        {/* Footer with Theme Selector */}
        <div className="absolute bottom-0 w-full p-4 border-t border-separator bg-surface/30">
            <div className="flex bg-surface rounded-lg p-1 border border-separator/50">
                <button 
                  onClick={() => onThemeChange('light')}
                  className={`flex-1 flex items-center justify-center py-1.5 rounded-md text-xs font-medium transition-all ${themePreference === 'light' ? 'bg-background text-textMain shadow-sm' : 'text-textSecondary hover:text-textMain'}`}
                  title="Light Mode"
                >
                    <Sun size={16} />
                </button>
                <button 
                  onClick={() => onThemeChange('system')}
                  className={`flex-1 flex items-center justify-center py-1.5 rounded-md text-xs font-medium transition-all ${themePreference === 'system' ? 'bg-background text-textMain shadow-sm' : 'text-textSecondary hover:text-textMain'}`}
                  title="System Default"
                >
                    <Smartphone size={16} />
                </button>
                <button 
                  onClick={() => onThemeChange('dark')}
                  className={`flex-1 flex items-center justify-center py-1.5 rounded-md text-xs font-medium transition-all ${themePreference === 'dark' ? 'bg-background text-textMain shadow-sm' : 'text-textSecondary hover:text-textMain'}`}
                  title="Dark Mode"
                >
                    <Moon size={16} />
                </button>
            </div>
            <div className="text-center mt-2 text-[10px] text-textSecondary">
                v1.2.1 • AI Powered
            </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;