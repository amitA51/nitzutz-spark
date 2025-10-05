import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

interface Connection {
  type: 'book' | 'article' | 'contradiction';
  title: string;
  relation: string;
  id: string;
}

interface ConnectionsSidebarProps {
  articleId: string;
}

const ConnectionsSidebar: React.FC<ConnectionsSidebarProps> = ({ articleId }) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchConnections = async () => {
      if (!articleId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/ai/find-connections`, {
          articleId,
        });
        setConnections(response.data.connections || []);
      } catch (err: any) {
        console.error('Error fetching connections:', err);
        setError('Failed to load connections');
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, [articleId]);

  if (loading) {
    return (
      <motion.div 
        className="bg-gray-dark rounded-lg p-6 border border-gray-light"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <h3 className="text-lg font-semibold mb-4 text-gradient font-sans">🕸️ קשרים</h3>
        <div className="flex items-center justify-center py-8">
          <motion.div 
            className="rounded-full h-8 w-8 border-2 border-primary border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="bg-gray-dark rounded-lg p-6 border border-gray-light"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h3 className="text-lg font-semibold mb-4 text-gradient font-sans">🕸️ קשרים</h3>
        <p className="text-sm text-red-400 font-serif">❌ {error}</p>
      </motion.div>
    );
  }

  if (connections.length === 0) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'book':
        return '📚';
      case 'article':
        return '📰';
      case 'contradiction':
        return '⚠️';
      default:
        return '🔗';
    }
  };

  const displayedConnections = showAll ? connections : connections.slice(0, 3);
  const hasMore = connections.length > 3;

  return (
    <motion.div 
      className="bg-gray-dark rounded-lg p-6 border border-gray-light"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ borderColor: 'rgba(59, 130, 246, 0.5)' }}
    >
      <motion.h3 
        className="text-lg font-semibold mb-4 text-gradient font-sans"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
      >
        🕸️ קשרים
      </motion.h3>
      <div className="space-y-3">
        {displayedConnections.map((connection, index) => (
          <motion.div
            key={index}
            className="border-r-2 border-primary pr-4 py-2 hover:bg-gray-medium transition-colors rounded-l"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ x: -5 }}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg flex-shrink-0">{getIcon(connection.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-1 font-sans">{connection.relation}</p>
                <p className="text-sm font-medium text-white font-serif">{connection.title}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Read More Button */}
      {hasMore && (
        <motion.button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 w-full text-sm text-primary hover:text-white transition-colors flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-medium font-sans"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {showAll ? (
            <>
              <span>הצג פחות</span>
              <span>↑</span>
            </>
          ) : (
            <>
              <span>קרא עוד ({connections.length - 3} נוספים)</span>
              <span>↓</span>
            </>
          )}
        </motion.button>
      )}
    </motion.div>
  );
};

export default ConnectionsSidebar;
