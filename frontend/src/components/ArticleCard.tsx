import React from 'react';
import SpotlightCard from './SpotlightCard';

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
  return (
    <SpotlightCard spotlightColor="rgba(59, 130, 246, 0.2)" className="bg-gray-dark border-gray-light">
      {/* Article Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-2xl font-bold text-white">{article.title}</h2>
          {article.readTime && (
            <span className="text-sm text-gray-400 whitespace-nowrap ml-4">
              {article.readTime} min read
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          {article.author && (
            <span>By {article.author}</span>
          )}
          <span className="px-2 py-1 bg-gray-medium rounded text-primary">
            {article.category}
          </span>
        </div>
      </div>
      
      {/* Article Image (if available) */}
      {article.imageUrl && (
        <div className="mb-4">
          <img 
            src={article.imageUrl} 
            alt={article.title}
            className="w-full h-64 object-cover rounded-lg"
          />
        </div>
      )}
      
      {/* Article Excerpt */}
      {article.excerpt && (
        <div className="mb-4">
          <p className="text-gray-300 italic">{article.excerpt}</p>
        </div>
      )}
      
      {/* Article Content */}
      <div className="prose prose-invert max-w-none">
        <p className="text-gray-300 whitespace-pre-wrap">{article.content}</p>
      </div>
    </SpotlightCard>
  );
};

export default ArticleCard;
