import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

interface KeyTakeawaysProps {
  articleId: string;
}

const KeyTakeaways: React.FC<KeyTakeawaysProps> = ({ articleId }) => {
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchKeyPoints = async () => {
      if (!articleId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/ai/extract-key-points`, {
          articleId,
        });
        let points: string[] = response.data.keyPoints || [];

        // If backend returned a single JSON-like string, try to parse it
        if (points.length === 1 && typeof points[0] === 'string' && /\[.*\]/s.test(points[0])) {
          try {
            const parsed = JSON.parse(points[0]);
            if (Array.isArray(parsed)) {
              points = parsed;
            }
          } catch {}
        }

        // Sanitize each point to remove code fences, brackets and quotes
        const cleaned = points
          .filter((p: any) => typeof p === 'string')
          .map((p: string) => {
            let s = p
              .replace(/```json/gi, '')
              .replace(/```/g, '')
              .replace(/^\s*\[|\]\s*$/g, '')
              .replace(/^[\s,]*(?:-|\*|•|\d+\.|–|—)\s*/, '')
              .replace(/^"+|"+$/g, '')
              .trim();
            // Remove stray JSON markers
            if (/^json$/i.test(s) || s === '[' || s === ']') return '';
            return s;
          })
          .filter(Boolean) as string[];

        setKeyPoints(cleaned);
      } catch (err: any) {
        console.error('Error fetching key takeaways:', err);
        setError('Failed to load key takeaways');
      } finally {
        setLoading(false);
      }
    };

    fetchKeyPoints();
  }, [articleId]);

  if (loading) {
    return (
      <motion.div 
        className="bg-gray-dark rounded-lg p-6 border border-gray-light"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <h3 className="text-lg font-semibold mb-4 text-gradient font-sans">🔑 נקודות מפתח</h3>
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
        <h3 className="text-lg font-semibold mb-4 text-gradient font-sans">🔑 נקודות מפתח</h3>
        <p className="text-sm text-red-400 font-serif">❌ {error}</p>
      </motion.div>
    );
  }

  if (keyPoints.length === 0) {
    return null;
  }

  const displayedPoints = showAll ? keyPoints : keyPoints.slice(0, 3);
  const hasMore = keyPoints.length > 3;

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
        🔑 נקודות מפתח
      </motion.h3>
      <ul className="space-y-3">
        {displayedPoints.map((point, index) => (
          <motion.li 
            key={index} 
            className="flex items-start"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ x: 5 }}
          >
            <span className="bg-gradient-accent text-white font-bold rounded-full w-6 h-6 flex items-center justify-center ml-3 mt-0.5 flex-shrink-0 text-xs">
              {index + 1}
            </span>
            <span className="text-sm text-gray-300 leading-relaxed font-serif">
              {point.replace(/^[-•*]\s*/, '').replace(/^"\s*|\s*"$/g, '')}
            </span>
          </motion.li>
        ))}
      </ul>
      
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
              <span>קרא עוד ({keyPoints.length - 3} נוספים)</span>
              <span>↓</span>
            </>
          )}
        </motion.button>
      )}
    </motion.div>
  );
};

export default KeyTakeaways;
