import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Source {
  title: string;
  url?: string;
  author?: string;
}

interface RelatedTopic {
  title: string;
  category: string;
  onClick?: () => void;
}

interface ArticleBubbleProps {
  title: string;
  content: string;
  excerpt?: string;
  author?: string;
  category?: string;
  readTime?: number;
  sources?: Source[];
  relatedTopics?: RelatedTopic[];
  publishedAt?: string;
  onSave?: () => void;
  isSaved?: boolean;
}

const ArticleBubble = ({
  title,
  content,
  excerpt,
  author,
  category,
  readTime,
  sources = [],
  relatedTopics = [],
  publishedAt,
  onSave,
  isSaved = false,
}: ArticleBubbleProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [showRelated, setShowRelated] = useState(false);

  const shouldTruncate = content.length > 500;
  const displayContent = isExpanded || !shouldTruncate ? content : content.slice(0, 500) + '...';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full max-w-4xl mx-auto"
    >
      {/* Glass-morphism card */}
      <div className="relative bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 shadow-2xl">
        {/* Header section */}
        <div className="mb-6">
          {/* Category & Meta info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 text-sm text-gray-400">
              {category && (
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full font-medium">
                  {category}
                </span>
              )}
              {readTime && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {readTime} דקות
                </span>
              )}
            </div>

            {/* Save button */}
            {onSave && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onSave}
                className={`p-2 rounded-full transition-colors ${
                  isSaved
                    ? 'bg-primary text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </motion.button>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
            {title}
          </h1>

          {/* Author & Date */}
          <div className="flex items-center gap-4 text-sm text-gray-400">
            {author && (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {author}
              </span>
            )}
            {publishedAt && (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(publishedAt).toLocaleDateString('he-IL')}
              </span>
            )}
          </div>
        </div>

        {/* Excerpt */}
        {excerpt && !isExpanded && (
          <div className="mb-4 p-4 bg-primary/10 border-r-4 border-primary rounded-lg">
            <p className="text-gray-300 text-lg leading-relaxed italic">
              {excerpt}
            </p>
          </div>
        )}

        {/* Main content */}
        <div className="mb-6">
          <div className="prose prose-invert prose-lg max-w-none">
            <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
              {displayContent}
            </p>
          </div>

          {/* Read more button */}
          {shouldTruncate && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-4 flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <span>{isExpanded ? 'הצג פחות' : 'קרא עוד'}</span>
              <motion.svg
                animate={{ rotate: isExpanded ? 180 : 0 }}
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </motion.svg>
            </motion.button>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-6" />

        {/* Sources section */}
        {sources.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center justify-between w-full text-right mb-3 group"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
                  מקורות ({sources.length})
                </span>
              </div>
              <motion.svg
                animate={{ rotate: showSources ? 180 : 0 }}
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </motion.svg>
            </button>

            <AnimatePresence>
              {showSources && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2">
                    {sources.map((source, index) => (
                      <motion.div
                        key={index}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors group"
                      >
                        <span className="text-primary font-mono text-sm mt-1">[{index + 1}]</span>
                        <div className="flex-1">
                          {source.url ? (
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-300 hover:text-primary transition-colors flex items-center gap-2 group"
                            >
                              <span>{source.title}</span>
                              <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          ) : (
                            <span className="text-gray-300">{source.title}</span>
                          )}
                          {source.author && (
                            <p className="text-sm text-gray-500 mt-1">{source.author}</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Related topics section */}
        {relatedTopics.length > 0 && (
          <div>
            <button
              onClick={() => setShowRelated(!showRelated)}
              className="flex items-center justify-between w-full text-right mb-3 group"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
                  נושאים קשורים
                </span>
              </div>
              <motion.svg
                animate={{ rotate: showRelated ? 180 : 0 }}
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </motion.svg>
            </button>

            <AnimatePresence>
              {showRelated && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {relatedTopics.map((topic, index) => (
                      <motion.button
                        key={index}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={topic.onClick}
                        className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg hover:from-primary/20 hover:to-primary/10 border border-gray-700/50 hover:border-primary/50 transition-all group text-right"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-white group-hover:text-primary transition-colors mb-1">
                            {topic.title}
                          </h4>
                          <p className="text-sm text-gray-500">{topic.category}</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Floating gradient effect */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 rounded-3xl blur-3xl" />
    </motion.div>
  );
};

export default ArticleBubble;
