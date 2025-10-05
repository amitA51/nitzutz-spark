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
      className="mb-8"
    >
      <SpotlightCard spotlightColor="rgba(59, 130, 246, 0.2)" className="bg-gray-dark border-gray-light p-8">
        {/* Article Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-3">
            <motion.h2 
              className="text-3xl font-bold text-white font-sans leading-tight"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              {article.title}
            </motion.h2>
            {article.readTime && (
              <motion.span 
                className="text-sm text-gray-400 whitespace-nowrap ml-4 font-sans"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {article.readTime} דקות קריאה
              </motion.span>
            )}
          </div>
          
          <motion.div 
            className="flex items-center space-x-4 text-sm text-gray-400 font-sans"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            {article.author && (
              <span>מאת {article.author}</span>
            )}
            <span className="px-2 py-1 bg-gradient-accent rounded text-white font-medium">
              {article.category}
            </span>
          </motion.div>
        </div>
        
        {/* Article Image (if available) */}
        {article.imageUrl && (
          <motion.div 
            className="mb-4 overflow-hidden rounded-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <img 
              src={article.imageUrl} 
              alt={article.title}
              className="w-full h-64 object-cover hover:scale-105 transition-transform duration-500"
            />
          </motion.div>
        )}
        
        {/* Divider */}
        <motion.div 
          className="border-t border-gradient-accent/30 my-6"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        />
        
        {/* Article Excerpt */}
        {article.excerpt && (
          <motion.div 
            className="mb-6 p-4 bg-gradient-to-r from-blue-900/10 to-purple-900/10 rounded-lg border-r-4 border-primary"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-gray-200 font-serif text-lg leading-relaxed italic">
              "עיקרי המאמר: {article.excerpt}"
            </p>
          </motion.div>
        )}
        
        {/* Article Content */}
        <motion.div 
          className="prose prose-invert max-w-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-gray-300 whitespace-pre-wrap font-serif text-base leading-relaxed tracking-wide">{display}</p>
          {shouldTruncate && (
            <div className="mt-4">
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
