import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import GradientButton from './GradientButton';

interface SpacedRepetitionPromptProps {
  articleId: string;
  articleTitle: string;
  onClose: () => void;
  onScheduled: () => void;
}

const SpacedRepetitionPrompt: React.FC<SpacedRepetitionPromptProps> = ({
  articleId,
  articleTitle,
  onClose,
  onScheduled,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedIntervals, setSelectedIntervals] = useState<number[]>([3, 7, 30]);

  const intervalOptions = [
    { days: 1, label: 'יום אחד' },
    { days: 3, label: '3 ימים' },
    { days: 7, label: 'שבוע' },
    { days: 14, label: 'שבועיים' },
    { days: 30, label: 'חודש' },
    { days: 90, label: '3 חודשים' },
  ];

  const toggleInterval = (days: number) => {
    if (selectedIntervals.includes(days)) {
      setSelectedIntervals(selectedIntervals.filter(d => d !== days));
    } else {
      setSelectedIntervals([...selectedIntervals, days].sort((a, b) => a - b));
    }
  };

  const handleSchedule = async () => {
    if (selectedIntervals.length === 0) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/spaced-repetition/schedule`, {
        articleId,
        intervals: selectedIntervals,
      });
      onScheduled();
      onClose();
    } catch (error) {
      console.error('Error scheduling repetitions:', error);
      alert('שגיאה בתזמון החזרות. נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="bg-gray-dark rounded-lg border border-gray-light max-w-md w-full p-6"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          <motion.h3 
            className="text-xl font-bold mb-2 text-gradient font-sans"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            📅 תזכורת לחזרה
          </motion.h3>
          <motion.p 
            className="text-sm text-gray-300 mb-4 font-serif"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            תזמן תזכורות לחזרה על הרעיונות המרכזיים ממאמר <span className="font-semibold text-gradient">\"{articleTitle}\"</span> וחזק את הזיכרון הארוך טווח שלך.
          </motion.p>

          <motion.div 
            className="space-y-3 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-xs text-gray-400 uppercase tracking-wide font-sans">מתי להזכיר לך?</p>
            <div className="grid grid-cols-2 gap-2">
              {intervalOptions.map(({ days, label }, index) => (
                <motion.button
                  key={days}
                  onClick={() => toggleInterval(days)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedIntervals.includes(days)
                      ? 'bg-gradient-accent text-white shadow-md'
                      : 'bg-gray-medium text-gray-400 hover:bg-gray-light'
                  }`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.div 
            className="flex gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <GradientButton
              onClick={onClose}
              variant="secondary"
              className="flex-1"
              disabled={loading}
            >
              דלג
            </GradientButton>
            <GradientButton
              onClick={handleSchedule}
              variant="primary"
              className="flex-1"
              disabled={loading || selectedIntervals.length === 0}
              isLoading={loading}
            >
              {loading ? 'מתזמן...' : 'תזמן חזרות'}
            </GradientButton>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SpacedRepetitionPrompt;
