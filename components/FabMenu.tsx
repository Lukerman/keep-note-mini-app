import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Mic, Image as ImageIcon, PenTool, CheckSquare, Type } from 'lucide-react';

interface FabMenuProps {
  onAction: (action: 'text' | 'list' | 'image' | 'drawing' | 'audio') => void;
}

const FabMenu: React.FC<FabMenuProps> = ({ onAction }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'audio', icon: Mic, label: 'Audio', color: 'bg-red-500' },
    { id: 'image', icon: ImageIcon, label: 'Image', color: 'bg-red-500' }, // Using red to match requested UI
    { id: 'drawing', icon: PenTool, label: 'Drawing', color: 'bg-red-500' },
    { id: 'list', icon: CheckSquare, label: 'List', color: 'bg-red-500' },
    { id: 'text', icon: Type, label: 'Text', color: 'bg-red-500' },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleAction = (id: string) => {
    onAction(id as any);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col items-end gap-3 mb-2">
            {menuItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
                className="flex items-center gap-3"
              >
                 <span className="bg-surface text-textMain px-3 py-1 rounded-lg text-sm font-medium shadow-md border border-separator/50">
                   {item.label}
                 </span>
                 <button
                  onClick={() => handleAction(item.id)}
                  className={`${item.color} text-white p-3 rounded-2xl shadow-lg hover:brightness-110 active:scale-95 transition-all`}
                >
                  <item.icon size={20} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={toggleMenu}
        animate={{ rotate: isOpen ? 45 : 0 }}
        className={`p-4 rounded-2xl shadow-xl transition-colors ${
          isOpen ? 'bg-surface text-textMain border border-separator' : 'bg-primary text-primaryText'
        }`}
      >
        {isOpen ? <Plus size={24} /> : <Plus size={28} />}
      </motion.button>
    </div>
  );
};

export default FabMenu;