import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface Book {
  id: string;
  bookTitle: string;
  currentPage: number;
  totalPages?: number;
  author?: string;
  isbn?: string;
}

interface BookItemProps {
  book: Book;
  isSelected: boolean;
  onSelect: () => void;
  onUpdateProgress: (newPage: number) => void;
  onDelete: () => void;
}

const BookItem: React.FC<BookItemProps> = ({ 
  book, 
  isSelected, 
  onSelect, 
  onUpdateProgress,
  onDelete 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newPage, setNewPage] = useState(book.currentPage.toString());
  
  const progressPercentage = book.totalPages 
    ? Math.round((book.currentPage / book.totalPages) * 100) 
    : 0;
  
  const handleUpdateProgress = () => {
    const pageNum = parseInt(newPage);
    if (!isNaN(pageNum) && pageNum >= 0) {
      onUpdateProgress(pageNum);
      setIsEditing(false);
    }
  };
  
  const handleCancelEdit = () => {
    setNewPage(book.currentPage.toString());
    setIsEditing(false);
  };

  return (
    <motion.div 
      className={`card cursor-pointer transition-all ${
        isSelected ? 'border-primary bg-gray-medium' : 'hover:border-gray-medium'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, borderColor: 'rgba(59, 130, 246, 0.5)' }}
      whileTap={{ scale: 0.98 }}
      onClick={(e) => {
        if (!isEditing && !(e.target as HTMLElement).closest('button')) {
          onSelect();
        }
      }}
    >
      {/* Book Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="text-lg font-semibold font-sans">{book.bookTitle}</h3>
          {book.author && (
            <p className="text-sm text-gray-400 font-serif">{book.author}</p>
          )}
        </div>
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-gray-400 hover:text-red-400 transition-colors p-1"
          whileHover={{ scale: 1.2, rotate: 10 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </motion.button>
      </div>
      
      {/* Progress Section */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400 font-sans">📚 התקדמות</span>
          {!isEditing ? (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="text-sm text-gradient hover:opacity-80 font-semibold font-sans"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {book.currentPage}{book.totalPages ? ` / ${book.totalPages}` : ''} עמודים
            </motion.button>
          ) : (
            <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="number"
                value={newPage}
                onChange={(e) => setNewPage(e.target.value)}
                className="w-20 px-2 py-1 text-sm bg-gray-dark border border-gray-light rounded"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
              <button
                onClick={handleUpdateProgress}
                className="text-green-400 hover:text-green-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={handleCancelEdit}
                className="text-red-400 hover:text-red-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
        
        {/* Progress Bar */}
        {book.totalPages && (
          <div className="w-full bg-gray-dark rounded-full h-2 overflow-hidden">
            <motion.div 
              className="bg-gradient-accent h-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        )}
        
        {book.totalPages && (
          <p className="text-xs text-gray-400 mt-1 text-right font-sans">
            {progressPercentage}% הושלם
          </p>
        )}
      </div>
      
      {/* ISBN (if available) */}
      {book.isbn && (
        <p className="text-xs text-gray-500 mt-2">ISBN: {book.isbn}</p>
      )}
    </motion.div>
  );
};

export default BookItem;