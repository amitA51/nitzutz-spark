import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}
export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const navItems = [
    { label: 'מנוע גילויים', href: '/', icon: '🔍', description: 'גלה תוכן חדש ומעניין' },
    { label: 'הספרייה שלי', href: '/library', icon: '📚', description: 'כל הספרים והסיכומים שלך' },
    { label: 'המנטור', href: '/mentor', icon: '🧠', description: 'תובנות שבועיות וחיבורים מפתיעים' },
    { label: 'Google Drive', href: '/drive', icon: '☁️', description: 'ייבא סיכומים מ-Drive' },
    { label: 'הגדרות', href: '/settings', icon: '⚙️', description: 'התאם אישית את החוויה' },
  ];

  // Handle swipe gestures
  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isRightSwipe = distance < -50;
    
    if (isRightSwipe && isOpen) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('touchstart', handleTouchStart);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isOpen, touchStart, touchEnd]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 md:hidden overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-l from-purple-600 to-blue-600 text-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">ניצוץ</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-white/80 text-sm">הצת את הלמידה שלך</p>
            </div>
            
            {/* Navigation Items */}
            <nav className="p-4">
              {navItems.map((item, index) => {
                const isActive = location.pathname === item.href;
                
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={item.href}
                      onClick={onClose}
                      className={`
                        flex items-start gap-4 p-4 rounded-xl mb-2 transition-all
                        ${isActive 
                          ? 'bg-gradient-to-l from-purple-100 to-blue-100 border border-purple-300' 
                          : 'hover:bg-gray-50'
                        }
                      `}
                    >
                      <span className="text-3xl">{item.icon}</span>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${isActive ? 'text-purple-700' : 'text-gray-800'}`}>
                          {item.label}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.description}
                        </p>
                      </div>
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="w-1 h-full bg-gradient-to-b from-purple-500 to-blue-500 rounded-full"
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
            
            {/* Bottom Section */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  א
                </div>
                <div>
                  <p className="font-semibold text-gray-800">אורח</p>
                  <p className="text-sm text-gray-600">ברוך הבא!</p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};