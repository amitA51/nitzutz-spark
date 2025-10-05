import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiContentAPI, type GenerateContentOptions } from '../api/aiContent';
import { googleDriveAPI } from '../api/googleDrive';

interface AIContentGeneratorProps {
  onGenerated?: () => void;
}

export const AIContentGenerator: React.FC<AIContentGeneratorProps> = ({ onGenerated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [driveConnected, setDriveConnected] = useState<boolean | null>(null);

  // Settings
  const [topics, setTopics] = useState<string[]>(['פסיכולוגיה', 'סייבר', 'פיננסים']);
  const [count, setCount] = useState(3);
  const [level, setLevel] = useState<'קל' | 'בינוני' | 'מתקדם'>('בינוני');
  const [useGoogleDrive, setUseGoogleDrive] = useState(true);

  // Check Google Drive status when opening
  React.useEffect(() => {
    if (isOpen && driveConnected === null) {
      checkDriveStatus();
    }
  }, [isOpen]);

  const checkDriveStatus = async () => {
    try {
      const status = await googleDriveAPI.getStatus();
      setDriveConnected(status.connected);
    } catch {
      setDriveConnected(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setLoadingMessage('מתחבר ל-AI...');

    try {
      const options: GenerateContentOptions = {
        topics,
        count,
        level,
      };

      // Update loading message based on count
      if (count === 1) {
        setLoadingMessage('יוצר כרטיסייה אחת... (~15 שניות)');
      } else if (count <= 3) {
        setLoadingMessage(`יוצר ${count} כרטיסיות... (~30 שניות)`);
      } else if (count <= 5) {
        setLoadingMessage(`יוצר ${count} כרטיסיות... (~45 שניות)`);
      } else {
        setLoadingMessage(`יוצר ${count} כרטיסיות... (יכול לקחת דקה-דקה וחצי)`);
      }

      let result;
      if (useGoogleDrive && driveConnected) {
        setLoadingMessage('מנתח את המסמכים שלך...');
        result = await aiContentAPI.generateFromDrive(options);
      } else {
        result = await aiContentAPI.generateByTopics(options);
      }

      setLoadingMessage('');
      setSuccess(result.message);
      
      // Close modal after 2 seconds and refresh
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(null);
        if (onGenerated) {
          onGenerated();
        }
      }, 2000);

    } catch (err: any) {
      console.error('Generation error:', err);
      setLoadingMessage('');
      
      // Better error messages
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('התהליך לקח יותר מדי זמן. נסה עם פחות כרטיסיות.');
      } else {
        setError(err.response?.data?.message || 'שגיאה ביצירת תוכן. נסה שוב.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleTopic = (topic: string) => {
    if (topics.includes(topic)) {
      setTopics(topics.filter(t => t !== topic));
    } else {
      setTopics([...topics, topic]);
    }
  };

  return (
    <>
      {/* Floating Action Button - Matching site theme */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 bg-gradient-accent hover:bg-gradient-accent-hover text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all"
        whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(59, 130, 246, 0.4)' }}
        whileTap={{ scale: 0.95 }}
        title="צור תוכן חדש באמצעות AI"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <motion.span
          className="absolute -top-1 -right-1 bg-accent text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-background"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          AI
        </motion.span>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-background/90 backdrop-blur-md z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Modal Content */}
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-gray-dark border border-gray-light rounded-2xl shadow-2xl max-w-lg w-full p-6 rtl"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-3 font-sans">
                    <span className="text-3xl">⚡</span>
                    מחולל תוכן AI
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  {/* Topics Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      נושאים מועדפים:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['פסיכולוגיה', 'סייבר', 'פיננסים', 'טכנולוגיה', 'עסקים'].map((topic) => (
                        <button
                          key={topic}
                          onClick={() => toggleTopic(topic)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            topics.includes(topic)
                              ? 'bg-gradient-accent text-white shadow-md shadow-primary/30'
                              : 'bg-gray-medium hover:bg-gray-light text-gray-300'
                          }`}
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Count */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      מספר כרטיסיות: <span className="text-gradient font-bold">{count}</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
                      className="w-full cursor-pointer"
                      style={{
                        accentColor: '#3B82F6',
                      }}
                    />
                  </div>

                  {/* Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      רמת קושי:
                    </label>
                    <div className="flex gap-2">
                      {(['קל', 'בינוני', 'מתקדם'] as const).map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => setLevel(lvl)}
                          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            level === lvl
                              ? 'bg-gradient-accent text-white shadow-md'
                              : 'bg-gray-medium hover:bg-gray-light text-gray-300'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Google Drive Option */}
                  {driveConnected !== null && (
                    <div className="bg-gray-medium border border-gray-light rounded-lg p-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useGoogleDrive}
                          onChange={(e) => setUseGoogleDrive(e.target.checked)}
                          disabled={!driveConnected}
                          className="w-5 h-5 accent-primary cursor-pointer"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-foreground">
                            התבסס על המסמכים שלי ב-Google Drive
                          </span>
                          {driveConnected ? (
                            <p className="text-xs text-green-400 mt-1">
                              ✓ מחובר - תוכן מותאם אישית מהמסמכים שלך
                            </p>
                          ) : (
                            <p className="text-xs text-red-400 mt-1">
                              ✗ לא מחובר - התחבר בהגדרות
                            </p>
                          )}
                        </div>
                      </label>
                    </div>
                  )}

                  {/* Error/Success Messages */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-900/30 border border-red-500/50 text-red-300 p-3 rounded-lg text-sm"
                    >
                      ⚠️ {error}
                    </motion.div>
                  )}

                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-green-900/30 border border-green-500/50 text-green-300 p-3 rounded-lg text-sm"
                    >
                      ✓ {success}
                    </motion.div>
                  )}

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={loading || topics.length === 0}
                    className="w-full bg-gradient-accent hover:bg-gradient-accent-hover text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex flex-col items-center justify-center gap-2">
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          יוצר תוכן...
                        </span>
                        {loadingMessage && (
                          <span className="text-xs text-gray-400">
                            {loadingMessage}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        צור {count} כרטיסיות חדשות
                      </span>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
