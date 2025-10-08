import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiContentAPI, type GenerateContentOptions, type UserProfile, type ProfileResponse } from '../api/aiContent';
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useSmartGeneration, setUseSmartGeneration] = useState(true);

  // Settings
  const [topics, setTopics] = useState<string[]>(['פסיכולוגיה', 'סייבר', 'פיננסים']);
  const [count, setCount] = useState(3);
  const [level, setLevel] = useState<'קל' | 'בינוני' | 'מתקדם'>('בינוני');
  const [useGoogleDrive, setUseGoogleDrive] = useState(true);

  // Check Google Drive status and load user profile when opening
  React.useEffect(() => {
    if (isOpen) {
      if (driveConnected === null) {
        checkDriveStatus();
      }
      if (!userProfile) {
        loadUserProfile();
      }
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

  const loadUserProfile = async () => {
    try {
      const profileData = await aiContentAPI.getUserProfile();
      setUserProfile(profileData.profile);
    } catch (error) {
      console.error('Failed to load user profile:', error);
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
      if (useSmartGeneration) {
        // שלבי יצירה חכמה עם הודעות מפרטות
        setLoadingMessage('🧠 מנתח את הפרופיל שלך...');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setLoadingMessage('📂 בודק Google Drive...');
        await new Promise(resolve => setTimeout(resolve, 600));
        
        setLoadingMessage('📋 יוצר תכנית תוכן מותאמת...');
        await new Promise(resolve => setTimeout(resolve, 600));
        
        if (count === 1) {
          setLoadingMessage('✍️ כותב מאמר מותאם אישית...');
        } else {
          setLoadingMessage(`✍️ כותב ${count} מאמרים חכמים...`);
        }
        
        result = await aiContentAPI.generateSmart(options);
      } else if (useGoogleDrive && driveConnected) {
        setLoadingMessage('מנתח את המסמכים שלך...');
        result = await aiContentAPI.generateFromDrive(options);
      } else {
        result = await aiContentAPI.generateByTopics(options);
      }

      setLoadingMessage('');
      
      // הצג מידע מפורט על התוצאות
      let successMessage = result.message;
      if (result.personalized && result.articles?.length > 0) {
        const article = result.articles[0];
        if (article.personalityMatch) {
          successMessage += ` (ציון התאמה: ${article.personalityMatch}%)`;
        }
        if (article.difficulty) {
          successMessage += ` - רמה: ${article.difficulty === 'beginner' ? 'מתחיל' : 
            article.difficulty === 'intermediate' ? 'בינוני' : 'מתקדם'}`;
        }
      }
      
      setSuccess(successMessage);
      
      // Close modal after 3 seconds and refresh
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(null);
        if (onGenerated) {
          onGenerated();
        }
      }, 3000);

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
                    <span className="text-3xl">{useSmartGeneration ? '🧠' : '⚡'}</span>
                    {useSmartGeneration ? 'מחולל תוכן חכם' : 'מחולל תוכן AI'}
                    {userProfile && (
                      <span className="text-xs bg-gradient-accent px-2 py-1 rounded-full text-white font-normal">
                        {userProfile.readingLevel === 'beginner' ? 'מתחיל' : 
                         userProfile.readingLevel === 'intermediate' ? 'בינוני' : 'מתקדם'}
                      </span>
                    )}
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
                  {/* Smart Generation Toggle */}
                  <div className="bg-gray-medium border border-gray-light rounded-lg p-4">
                    <label className="flex items-center gap-3 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={useSmartGeneration}
                        onChange={(e) => setUseSmartGeneration(e.target.checked)}
                        className="w-5 h-5 accent-primary cursor-pointer"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-foreground flex items-center gap-2">
                          🧠 יצירה חכמה ומותאמת אישית
                          <span className="text-xs bg-green-600 px-2 py-0.5 rounded text-white">מומלץ</span>
                        </span>
                        <p className="text-xs text-gray-300 mt-1">
                          {userProfile ? 
                            `מנתח את הפרופיל שלך (${userProfile.topCategories.length} תחומי עניין, רמה: ${userProfile.readingLevel})` :
                            'ניתוח מלא של ההעדפות שלך + Google Drive + בינה מלאכותית מתקדמת'
                          }
                        </p>
                      </div>
                    </label>
                    
                    {/* Advanced Options Button */}
                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="text-xs text-primary hover:text-primary-light transition-colors"
                    >
                      {showAdvanced ? '🔽 הסתר אפשרויות מתקדמות' : '🔧 אפשרויות מתקדמות'}
                    </button>
                  </div>
                  
                  {/* Advanced Options */}
                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                        {/* User Profile Display */}
                        {userProfile && (
                          <div className="bg-gray-dark border border-gray-light rounded-lg p-4">
                            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                              📊 הפרופיל שלך
                              <button
                                onClick={loadUserProfile}
                                className="text-xs text-primary hover:text-primary-light"
                              >
                                🔄 עדכן
                              </button>
                            </h3>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-300">רמת קריאה:</span>
                                <span className="text-foreground ml-2">
                                  {userProfile.readingLevel === 'beginner' ? 'מתחיל' : 
                                   userProfile.readingLevel === 'intermediate' ? 'בינוני' : 'מתקדם'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-300">סגנון מועדף:</span>
                                <span className="text-foreground ml-2">
                                  {userProfile.contentStyle === 'practical' ? 'מעשי' : 
                                   userProfile.contentStyle === 'theoretical' ? 'תיאורטי' : 'מעורב'}
                                </span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-gray-300">תחומי עניין עיקריים:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {userProfile.topCategories.slice(0, 3).map((cat, i) => (
                                    <span key={i} className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                                      {cat.category} ({Math.round(cat.score * 100)}%)
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
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

                  {/* Google Drive Option - Only shown when not using smart generation */}
                  {!useSmartGeneration && driveConnected !== null && (
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
                            התבסס על המסמכים שלי ב-Google Drive (מצב ישן)
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
                        {useSmartGeneration ? (
                          <>
                            <span className="text-lg">🧠</span>
                            צור {count} מאמרים חכמים
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            צור {count} כרטיסיות חדשות
                          </>
                        )}
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
