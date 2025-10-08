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
        className="bg-gray-dark rounded-lg p-3 border border-gray-light"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <h3 className="text-sm font-semibold mb-2 text-gradient font-sans">🕸️ קשרים</h3>
        <div className="flex items-center justify-center py-4">
          <motion.div 
            className="rounded-full h-6 w-6 border-2 border-primary border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="bg-gray-dark rounded-lg p-3 border border-gray-light"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h3 className="text-sm font-semibold mb-2 text-gradient font-sans">🕸️ קשרים</h3>
        <p className="text-xs text-red-400 font-serif">❌ {error}</p>
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
    <div>
      <div className="space-y-2">
        {displayedConnections.map((connection, index) => (
          <motion.div
            key={index}
            className="border-r-2 border-primary pr-2 py-1.5 hover:bg-gray-medium transition-colors rounded-l"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ x: -3 }}
          >
            <div className="flex items-start gap-1.5">
              <span className="text-base flex-shrink-0">{getIcon(connection.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 mb-0.5 font-sans">{connection.relation}</p>
                <p className="text-xs font-medium text-white font-serif leading-tight">{connection.title}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Read More Button */}
      {hasMore && (
        <motion.button
          onClick={() => setShowAll(!showAll)}
          className="mt-2 w-full text-xs text-primary hover:text-white transition-colors flex items-center justify-center gap-1 py-1.5 rounded-lg hover:bg-gray-medium font-sans"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {showAll ? (
            <>
              <span>פחות</span>
              <span>↑</span>
            </>
          ) : (
            <>
              <span>+{connections.length - 3}</span>
              <span>↓</span>
            </>
          )}
        </motion.button>
      )}
    </div>
  );
};

export default ConnectionsSidebar;
