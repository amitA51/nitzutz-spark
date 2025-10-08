import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SpotlightCard from './SpotlightCard';
import GradientButton from './GradientButton';

interface Article {
  id: string;
  title: string;
  content: string;
  author?: string;
  category: string;
  excerpt?: string;
  readTime?: number;
  imageUrl?: string;
  isSaved?: boolean;
}

interface ArticleCardProps {
  article: Article;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const [expanded, setExpanded] = useState(false);
  const maxLen = 600;
  const shouldTruncate = (article.content || '').length > maxLen;
  const display = expanded || !shouldTruncate
    ? article.content
    : `${article.content.slice(0, maxLen)}...`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="h-full flex flex-col"
    >
      <SpotlightCard spotlightColor="rgba(59, 130, 246, 0.2)" className="bg-gray-dark border-gray-light p-6 h-full flex flex-col overflow-hidden">
        {/* Article Header */}
        <div className="flex-shrink-0 mb-4">
          <div className="flex items-start justify-between mb-2">
            <motion.h2 
              className="text-2xl font-bold text-white font-sans leading-tight"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              {article.title}
            </motion.h2>
            {article.readTime && (
              <motion.span 
                className="text-sm text-gray-400 whitespace-nowrap ml-4 font-sans flex-shrink-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {article.readTime} דקות קריאה
              </motion.span>
            )}
          </div>
          
          <motion.div 
            className="flex items-center gap-3 text-sm text-gray-400 font-sans flex-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            {article.author && (
              <span className="flex items-center gap-1">
                <span className="text-primary">✍️</span>
                <span>מאת {article.author}</span>
              </span>
            )}
            <span className="px-3 py-1 bg-gradient-accent rounded-full text-white font-medium text-xs shadow-md">
              {article.category}
            </span>
          </motion.div>
        </div>
        
        {/* Divider */}
        <motion.div 
          className="border-t border-gradient-accent/30 my-3 flex-shrink-0"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        />
        
        {/* Article Excerpt */}
        {article.excerpt && (
          <motion.div 
            className="mb-3 p-3 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border-r-4 border-primary flex-shrink-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-gray-200 font-serif text-sm leading-relaxed italic line-clamp-2">
              💡 {article.excerpt}
            </p>
          </motion.div>
        )}
        
        {/* Article Content - Scrollable */}
        <motion.div 
          className="flex-1 overflow-y-auto min-h-0 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="prose prose-invert max-w-none pr-2">
            <p className="text-gray-300 whitespace-pre-wrap font-serif text-sm leading-relaxed">{display}</p>
          </div>
        </motion.div>
        
        {/* Read More Button - Always Visible at Bottom */}
        {shouldTruncate && (
          <motion.div 
            className="flex-shrink-0 pt-3 border-t border-gray-light/30 bg-gradient-to-t from-gray-dark via-gray-dark to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <GradientButton
              onClick={() => setExpanded(!expanded)}
              variant="primary"
              size="sm"
              className="w-full"
            >
              {expanded ? '▲ הצג פחות' : '▼ קרא עוד'}
            </GradientButton>
          </motion.div>
        )}
      </SpotlightCard>
    </motion.div>
  );
};

export default ArticleCard;
