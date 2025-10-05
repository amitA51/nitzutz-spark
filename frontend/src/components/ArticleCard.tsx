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
  const maxLen = 300; // Reduced from 600
  const shouldTruncate = (article.content || '').length > maxLen;
  const display = expanded || !shouldTruncate
    ? article.content
    : `${article.content.slice(0, maxLen)}...`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mb-4"
    >
      <SpotlightCard spotlightColor="rgba(59, 130, 246, 0.2)" className="bg-gray-dark border-gray-light p-4">
        {/* Article Header */}
        <div className="mb-3">
          <div className="flex items-start justify-between mb-2">
            <motion.h2 
              className="text-xl font-bold text-white font-sans leading-tight"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              {article.title}
            </motion.h2>
            {article.readTime && (
              <motion.span 
                className="text-xs text-gray-400 whitespace-nowrap ml-3 font-sans"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {article.readTime}׳
              </motion.span>
            )}
          </div>
          
          <motion.div 
            className="flex items-center space-x-3 text-xs text-gray-400 font-sans"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12 }}
          >
            {article.author && (
              <span>מאת {article.author}</span>
            )}
            <span className="px-2 py-0.5 bg-gradient-accent rounded text-white text-xs">
              {article.category}
            </span>
          </motion.div>
        </div>
        
        {/* Article Image (if available) - Hidden for compact view */}
        {article.imageUrl && expanded && (
          <motion.div 
            className="mb-3 overflow-hidden rounded-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <img 
              src={article.imageUrl} 
              alt={article.title}
              className="w-full h-40 object-cover hover:scale-105 transition-transform duration-500"
            />
          </motion.div>
        )}
        
        {/* Article Excerpt - Only when expanded */}
        {article.excerpt && expanded && (
          <motion.div 
            className="mb-3 p-3 bg-gradient-to-r from-blue-900/10 to-purple-900/10 rounded-lg border-r-2 border-primary"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-gray-200 font-serif text-sm leading-relaxed italic">
              {article.excerpt}
            </p>
          </motion.div>
        )}
        
        {/* Article Content */}
        <motion.div 
          className="prose prose-invert max-w-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-gray-300 whitespace-pre-wrap font-serif text-sm leading-relaxed">{display}</p>
          {shouldTruncate && (
            <div className="mt-3">
              <GradientButton
                onClick={() => setExpanded(!expanded)}
                variant="primary"
                size="sm"
              >
                {expanded ? 'הצג פחות' : 'קרא עוד'}
              </GradientButton>
            </div>
          )}
        </motion.div>
      </SpotlightCard>
    </motion.div>
  );
};

export default ArticleCard;
