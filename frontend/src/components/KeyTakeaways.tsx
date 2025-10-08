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
        className="bg-gray-dark rounded-lg p-3 border border-gray-light"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <h3 className="text-sm font-semibold mb-2 text-gradient font-sans">🔑 נקודות מפתח</h3>
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
        <h3 className="text-sm font-semibold mb-2 text-gradient font-sans">🔑 נקודות מפתח</h3>
        <p className="text-xs text-red-400 font-serif">❌ {error}</p>
      </motion.div>
    );
  }

  if (keyPoints.length === 0) {
    return null;
  }

  const displayedPoints = showAll ? keyPoints : keyPoints.slice(0, 3);
  const hasMore = keyPoints.length > 3;

  return (
    <div>
      <ul className="space-y-2">
        {displayedPoints.map((point, index) => (
          <motion.li 
            key={index} 
            className="flex items-start"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ x: 3 }}
          >
            <span className="bg-gradient-accent text-white font-bold rounded-full w-5 h-5 flex items-center justify-center ml-2 mt-0.5 flex-shrink-0 text-[10px]">
              {index + 1}
            </span>
            <span className="text-xs text-gray-300 leading-snug font-serif">
              {point.replace(/^[-•*]\s*/, '').replace(/^"\s*|\s*"$/g, '')}
            </span>
          </motion.li>
        ))}
      </ul>
      
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
              <span>+{keyPoints.length - 3}</span>
              <span>↓</span>
            </>
          )}
        </motion.button>
      )}
    </div>
  );
};

export default KeyTakeaways;
