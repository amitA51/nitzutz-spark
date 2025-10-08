import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface SummaryBubbleProps {
  title: string;
  bookTitle: string;
  bookAuthor?: string;
  content: string;
  keyTakeaways?: string[];
  personalNotes?: string;
  rating?: number;
  createdAt: string;
  onEdit?: () => void;
  onShare?: () => void;
  relatedTopics?: string[];
  onTopicClick?: (topic: string) => void;
  sourceType?: 'book' | 'article' | 'google_drive';
  googleDriveLink?: string;
}

export const SummaryBubble: React.FC<SummaryBubbleProps> = ({
  title,
  bookTitle,
  bookAuthor,
  content,
  keyTakeaways = [],
  personalNotes,
  rating,
  createdAt,
  onEdit,
  onShare,
  relatedTopics = [],
  onTopicClick,
  sourceType,
  googleDriveLink,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSources, setShowSources] = useState(false);
  
  const maxContentLength = 300;
  const shouldTruncate = content.length > maxContentLength;
  const displayContent = isExpanded ? content : content.slice(0, maxContentLength) + '...';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 hover:border-white/30 transition-all duration-300"
    >
      {/* Glass effect overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 opacity-50" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="font-medium">
              📚 {bookTitle} {bookAuthor && `- ${bookAuthor}`}
            </span>
            {sourceType === 'google_drive' && (
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">
                Google Drive
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none mb-4">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {displayContent}
          </p>
          
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-600 hover:text-blue-700 font-semibold mt-2 inline-flex items-center gap-1"
            >
              {isExpanded ? 'הצג פחות' : 'קרא עוד'}
              <motion.span
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                ▼
              </motion.span>
            </button>
          )}
        </div>

        {/* Key Takeaways */}
        {keyTakeaways.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              💡 נקודות מפתח
            </h4>
            <ul className="space-y-2">
              {keyTakeaways.map((takeaway, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-2"
                >
                  <span className="text-purple-500 mt-1">•</span>
                  <span className="text-gray-700">{takeaway}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}

        {/* Personal Notes */}
        {personalNotes && (
          <div className="mb-4 bg-yellow-50/50 rounded-lg p-3 border border-yellow-200/50">
            <h4 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
              ✏️ הערות אישיות
            </h4>
            <p className="text-gray-700 text-sm">{personalNotes}</p>
          </div>
        )}

        {/* Rating */}
        {rating !== undefined && rating > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-xl ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Related Topics */}
        {relatedTopics.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-800 mb-2">נושאים קשורים</h4>
            <div className="flex flex-wrap gap-2">
              {relatedTopics.map((topic, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onTopicClick?.(topic)}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium hover:shadow-lg transition-shadow"
                >
                  {topic}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSources(!showSources)}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center gap-1"
            >
              📖 מקורות
            </button>
            
            {googleDriveLink && (
              <a
                href={googleDriveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
              >
                🔗 פתח ב-Drive
              </a>
            )}
            
            <span className="text-gray-500 text-sm">
              {format(new Date(createdAt), 'dd בMMM yyyy', { locale: he })}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="ערוך"
              >
                ✏️
              </button>
            )}
            {onShare && (
              <button
                onClick={onShare}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="שתף"
              >
                🔗
              </button>
            )}
          </div>
        </div>

        {/* Sources Dropdown */}
        <AnimatePresence>
          {showSources && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 pt-4 border-t border-white/20 overflow-hidden"
            >
              <div className="bg-gray-50/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📚</span>
                  <div>
                    <p className="font-semibold text-gray-800">{bookTitle}</p>
                    {bookAuthor && <p className="text-sm text-gray-600">מאת {bookAuthor}</p>}
                    {sourceType === 'google_drive' && (
                      <p className="text-xs text-gray-500 mt-1">יובא מ-Google Drive</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};