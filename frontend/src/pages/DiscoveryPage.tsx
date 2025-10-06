import { useEffect, useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, useMotionValue, useTransform, AnimatePresence, type PanInfo } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import ArticleCard from '../components/ArticleCard';
import KeyTakeaways from '../components/KeyTakeaways';
import ConnectionsSidebar from '../components/ConnectionsSidebar';
import SpacedRepetitionPrompt from '../components/SpacedRepetitionPrompt';
import { articlesAPI, type Article } from '../api/articles';
import { savedArticlesAPI } from '../api/savedArticles';
import apiClient from '../api/client';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/Toast';

// Using Article type from API layer

const DiscoveryPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deckArticles, setDeckArticles] = useState<Article[]>([]);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponses, setAiResponses] = useState<any[]>([]);
  const [devilsAdvocateMode, setDevilsAdvocateMode] = useState(false);
  const [showRepetitionPrompt, setShowRepetitionPrompt] = useState(false);
  const [repetitionArticle, setRepetitionArticle] = useState<{ id: string; title: string } | null>(null);
  const [sessionSaved, setSessionSaved] = useState<Article[]>([]);
  const [saveAnimation, setSaveAnimation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openSection, setOpenSection] = useState<'takeaways' | 'connections' | null>('takeaways');
  const [readingLength, setReadingLength] = useState<'all'|'short'|'medium'|'long'>('all');
  const { toasts, addToast, removeToast, ToastContainer: ToastView } = useToast();

  // Queries
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => articlesAPI.getCategories(),
    staleTime: 1000 * 60 * 5,
  });

  const articlesQuery = useQuery({
    queryKey: ['articles', selectedCategory],
    queryFn: () => articlesAPI.getAll(1, 20, selectedCategory !== 'all' ? selectedCategory : undefined),
  });

  const categories = useMemo(() => ['all', ...(categoriesQuery.data || [])], [categoriesQuery.data]);
  const articles = articlesQuery.data?.articles || [];

  // Filter articles by search query
  const searchedArticles = useMemo(() => {
    if (!searchQuery.trim()) return articles;
    const query = searchQuery.toLowerCase();
    return articles.filter(a => 
      a.title.toLowerCase().includes(query) ||
      a.content.toLowerCase().includes(query) ||
      (a.excerpt && a.excerpt.toLowerCase().includes(query))
    );
  }, [articles, searchQuery]);

  const wordCount = (a: Article) => (a.content || a.excerpt || '').split(/\s+/).filter(Boolean).length;
  const lengthFilteredArticles = useMemo(() => {
    if (readingLength === 'all') return searchedArticles;
    return searchedArticles.filter(a => {
      const wc = wordCount(a);
      if (readingLength === 'short') return wc < 500;
      if (readingLength === 'medium') return wc >= 500 && wc <= 1500;
      return wc > 1500; // long
    });
  }, [searchedArticles, readingLength]);

  // Reset deck on data change
  useEffect(() => {
    setDeckArticles(lengthFilteredArticles);
    setCurrentIndex(0);
    setSessionSaved([]);
  }, [lengthFilteredArticles]);

  const handleSaveArticle = useCallback(async () => {
    const article = deckArticles[currentIndex];
    if (!article) return;
    
    // Trigger animation
    setSaveAnimation(true);
    setTimeout(() => setSaveAnimation(false), 600);
    
    try {
      if (article.isSaved) {
        await savedArticlesAPI.remove(article.id);
        const updated = [...deckArticles];
        updated[currentIndex] = { ...article, isSaved: false };
        setDeckArticles(updated);
      } else {
        await savedArticlesAPI.save(article.id);
        const updated = [...deckArticles];
        updated[currentIndex] = { ...article, isSaved: true };
        setDeckArticles(updated);
        setSessionSaved(prev => [updated[currentIndex], ...prev]);
        setRepetitionArticle({ id: article.id, title: article.title });
        setShowRepetitionPrompt(true);
        addToast('המאמר נשמר', 'success');
      }
    } catch (error) {
      console.error('Error saving article:', error);
      addToast('שגיאה בשמירת המאמר', 'error');
    }
  }, [deckArticles, currentIndex]);

  // Keyboard shortcuts: Left/Right for navigation, S to save
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setCurrentIndex(i => Math.min(deckArticles.length - 1, i + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex(i => Math.max(0, i - 1));
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveArticle();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deckArticles.length, handleSaveArticle]);

  const handleAskAI = async () => {
    const article = deckArticles[currentIndex];
    if (!aiQuestion.trim() || !article) return;
    try {
      const response = await apiClient.post('/ai/ask', {
        articleId: article.id,
        question: aiQuestion,
        mode: devilsAdvocateMode ? 'devils-advocate' : 'normal',
        categoryHint: selectedCategory !== 'all' ? selectedCategory : undefined,
      });
      setAiResponses([response.data, ...aiResponses]);
      setAiQuestion('');
    } catch (error) {
      setAiResponses([
        {
          question: aiQuestion,
          answer: 'This is a placeholder response. Configure your AI API key in settings to get real answers.',
          createdAt: new Date().toISOString(),
        },
        ...aiResponses,
      ]);
      setAiQuestion('');
    }
  };

  // Swipe deck setup
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-10, 0, 10]);
  const showSave = useTransform(x, [80, 160], [0, 1]);
  const showSkip = useTransform(x, [-80, -160], [0, 1]);

  const onDragEnd = (_: any, info: PanInfo) => {
    const threshold = 140;
    if (info.offset.x > threshold) {
      handleSaveArticle();
      setCurrentIndex(i => Math.min(deckArticles.length, i + 1));
      x.set(0);
    } else if (info.offset.x < -threshold) {
      // Skip to next article
      setCurrentIndex(i => Math.min(deckArticles.length, i + 1));
      x.set(0);
    } else {
      x.set(0);
    }
  };

  const currentArticle = deckArticles[currentIndex];

  return (
    <PageTransition>
    <div className="max-w-7xl mx-auto">
      {/* Spaced Repetition Prompt Modal */}
      {showRepetitionPrompt && repetitionArticle && (
        <SpacedRepetitionPrompt
          articleId={repetitionArticle.id}
          articleTitle={repetitionArticle.title}
          onClose={() => setShowRepetitionPrompt(false)}
          onScheduled={() => addToast('חזרות תוזמנו', 'success')}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Categories & Search */}
        <motion.div 
          className="lg:col-span-1 space-y-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Search Box */}
          <div className="card p-4">
            <h3 className="text-lg font-bold mb-3 text-gradient font-sans">🔍 חיפוש</h3>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חפש מאמרים..."
                className="input w-full pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-xs text-gray-400 mt-2">
                נמצאו {lengthFilteredArticles.length} תוצאות
              </p>
            )}
          </div>

          {/* Category Filter */}
          <div className="card p-4">
            <h3 className="text-lg font-bold mb-3 text-gradient font-sans">📚 קטגוריות</h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <motion.button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-right px-4 py-2.5 rounded-lg font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-gradient-accent text-white shadow-md'
                      : 'bg-gray-dark hover:bg-gray-medium text-gray-300 border border-gray-light'
                  }`}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="flex items-center justify-between">
                    <span>{cat === 'all' ? 'הכל' : cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                    {selectedCategory === cat && <span>✓</span>}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Reading Length Filter */}
          <div className="card p-4">
            <h3 className="text-lg font-bold mb-3 text-gradient font-sans">⏱️ אורך קריאה</h3>
            <div className="flex flex-wrap gap-2">
              {([
                {k:'all', label:'הכל'},
                {k:'short', label:'קצר'},
                {k:'medium', label:'בינוני'},
                {k:'long', label:'ארוך'},
              ] as const).map(opt => (
                <button
                  key={opt.k}
                  onClick={() => setReadingLength(opt.k)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    readingLength === opt.k ? 'bg-primary text-white border-primary' : 'bg-gray-dark border-gray-light text-gray-300 hover:bg-gray-medium'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recommended for You Section */}
          {sessionSaved.length > 0 && (
            <motion.div
              className="card p-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-primary"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-2xl font-bold text-gradient mb-3 font-sans flex items-center gap-2">
                ✨ מומלץ עבורך
              </h3>
              <p className="text-gray-300 font-serif text-sm mb-4">
                בהתבסס על מה ששמרת לאחרונה, אנו ממליצים על נושאים שעשויים לעניין אותך:
              </p>
              <div className="flex flex-wrap gap-2">
                {sessionSaved.slice(0, 3).map((article) => (
                  <motion.div
                    key={article.id}
                    className="px-3 py-1.5 bg-gray-dark/50 rounded-full text-sm text-gray-300 border border-primary/30"
                    whileHover={{ scale: 1.05, borderColor: 'rgba(59, 130, 246, 0.8)' }}
                  >
                    {article.category}
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>המלצות מבוססות על {sessionSaved.length} מאמרים ששמרת</span>
              </div>
            </motion.div>
          )}

          {/* Article Display: Deck */}
          {articlesQuery.isLoading ? (
            <div className="flex items-center justify-center h-96">
              <Loader text="טוען מאמרים..." />
            </div>
          ) : currentArticle ? (
            <>
              {/* Deck stack */}
              <div className="relative h-[28rem]">
                {deckArticles.slice(currentIndex, currentIndex + 3).map((a, idx) => (
                  <motion.div
                    key={a.id}
                    className="absolute inset-0"
                    style={
                      idx === 0
                        ? { zIndex: 10 - idx, y: idx * 10, scale: 1 - idx * 0.04, x, rotate }
                        : { zIndex: 10 - idx, y: idx * 10, scale: 1 - idx * 0.04 }
                    }
                    drag={idx === 0 ? 'x' : undefined}
                    dragConstraints={idx === 0 ? { left: 0, right: 0 } : undefined}
                    onDragEnd={idx === 0 ? onDragEnd : undefined}
                  >
                    <ArticleCard article={a} />
                    {idx === 0 && (
                      <>
                        <motion.div
                          className="absolute top-4 left-4 text-gradient font-bold text-lg font-sans"
                          style={{ opacity: showSave }}
                        >
                          שמור
                        </motion.div>
                        <motion.div
                          className="absolute top-4 right-4 text-gray-400 font-bold text-lg"
                          style={{ opacity: showSkip }}
                        >
                          דלג
                        </motion.div>
                      </>
                    )}
                  </motion.div>
                ))}
              </div>
              
              {/* Navigation Controls */}
              <div className="mt-6 space-y-6 bg-gray-dark/50 p-6 rounded-2xl border border-gray-light">
                {/* Progress Indicator with Article Count */}
                <div className="space-y-3">
                  {/* Article Counter - Prominent */}
                  <div className="flex justify-center">
                    <div className="bg-gradient-accent px-6 py-3 rounded-xl shadow-lg">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white font-sans">
                          {currentIndex + 1}
                        </span>
                        <span className="text-xl text-white/80 font-sans">
                          /
                        </span>
                        <span className="text-2xl font-semibold text-white/90 font-sans">
                          {deckArticles.length}
                        </span>
                      </div>
                      <div className="text-xs text-white/70 text-center mt-1 font-sans">
                        כרטיסיות זמינות
                      </div>
                    </div>
                  </div>

                  {/* Progress Dots/Bar */}
                  <div className="flex justify-center items-center gap-2 py-2">
                    {deckArticles.length > 0 && (
                      <>
                        {deckArticles.length <= 15 ? (
                          // Show dots for up to 15 items
                          deckArticles.map((_, idx) => (
                            <motion.div
                              key={idx}
                              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                                idx === currentIndex 
                                  ? 'bg-gradient-accent w-10 shadow-lg shadow-primary/50' 
                                  : idx < currentIndex
                                  ? 'bg-primary/50 w-2.5'
                                  : 'bg-gray-light w-2.5'
                              }`}
                              onClick={() => setCurrentIndex(idx)}
                              whileHover={{ scale: 1.3 }}
                              whileTap={{ scale: 0.9 }}
                              title={`כרטיסייה ${idx + 1}`}
                            />
                          ))
                        ) : (
                          // Show progress bar for many items
                          <div className="w-full max-w-md">
                            <div className="h-4 bg-gray-dark rounded-full overflow-hidden border-2 border-gray-light shadow-inner">
                              <motion.div
                                className="h-full bg-gradient-accent rounded-full shadow-lg"
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentIndex + 1) / deckArticles.length) * 100}%` }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                            <div className="text-xs text-gray-400 text-center mt-2 font-sans">
                              {Math.round(((currentIndex + 1) / deckArticles.length) * 100)}% הושלם
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-center gap-8">
                  {/* Previous Button (Left in RTL) */}
                  <motion.button
                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                    disabled={currentIndex === 0}
                    className={`flex flex-col items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all min-w-[140px] ${
                      currentIndex === 0 
                        ? 'bg-gray-dark/50 text-gray-600 cursor-not-allowed border border-gray-light/30' 
                        : 'bg-gradient-accent hover:bg-gradient-accent-hover text-white shadow-xl hover:shadow-2xl hover:shadow-primary/40 border-2 border-primary/30'
                    }`}
                    whileHover={currentIndex > 0 ? { scale: 1.08, y: -3 } : {}}
                    whileTap={currentIndex > 0 ? { scale: 0.95 } : {}}
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                    <span className="text-lg font-sans">קודם</span>
                    {currentIndex > 0 && (
                      <span className="text-xs text-white/70">←</span>
                    )}
                  </motion.button>
                  
                  {/* Next Button (Right in RTL) */}
                  <motion.button
                    onClick={() => setCurrentIndex(Math.min(deckArticles.length - 1, currentIndex + 1))}
                    disabled={currentIndex === deckArticles.length - 1}
                    className={`flex flex-col items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all min-w-[140px] ${
                      currentIndex === deckArticles.length - 1
                        ? 'bg-gray-dark/50 text-gray-600 cursor-not-allowed border border-gray-light/30' 
                        : 'bg-gradient-accent hover:bg-gradient-accent-hover text-white shadow-xl hover:shadow-2xl hover:shadow-primary/40 border-2 border-primary/30'
                    }`}
                    whileHover={currentIndex < deckArticles.length - 1 ? { scale: 1.08, y: -3 } : {}}
                    whileTap={currentIndex < deckArticles.length - 1 ? { scale: 0.95 } : {}}
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                    <span className="text-lg font-sans">הבא</span>
                    {currentIndex < deckArticles.length - 1 && (
                      <span className="text-xs text-white/70">→</span>
                    )}
                  </motion.button>
                </div>
              </div>
              
              {/* Save Button with Animation */}
              <div className="mt-4 flex justify-center relative">
                <motion.button
                  onClick={handleSaveArticle}
                  className={`${currentArticle.isSaved ? 'btn-secondary' : 'btn-primary'} flex items-center space-x-2`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={saveAnimation ? { 
                    scale: [1, 1.2, 1],
                    boxShadow: ['0 0 0 0 rgba(59, 130, 246, 0.7)', '0 0 0 10px rgba(59, 130, 246, 0)', '0 0 0 0 rgba(59, 130, 246, 0)']
                  } : {}}
                  transition={{ duration: 0.6 }}
                >
                  <motion.svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5" 
                    fill={currentArticle.isSaved ? 'currentColor' : 'none'} 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    animate={saveAnimation ? { rotate: [0, -10, 10, 0] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </motion.svg>
                  <span>{currentArticle.isSaved ? 'נשמר' : 'שמור מאמר'}</span>
                </motion.button>
                
                {/* Success Checkmark Animation */}
                {saveAnimation && (
                  <motion.div
                    className="absolute top-0 right-1/2 transform translate-x-1/2"
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: [0, 1, 0], y: [-30, -50, -70] }}
                    transition={{ duration: 0.6 }}
                  >
                    <span className="text-2xl">✓</span>
                  </motion.div>
                )}
              </div>
            </>
          ) : (
              <div className="card">
              <h3 className="text-xl font-bold mb-2 font-sans">סיכום הסשן</h3>
              <p className="text-gray-400 mb-4 font-serif">סיימת לעבור על כל המאמרים בסשן הזה.</p>
              {deckArticles.length === 0 && (
                <EmptyState
                  icon={<span>🔍</span>}
                  title={searchQuery || selectedCategory !== 'all' || readingLength !== 'all' ? 'לא נמצאו מאמרים' : 'אין מאמרים כרגע'}
                  description={searchQuery || selectedCategory !== 'all' || readingLength !== 'all' ? 'נסה לשנות חיפוש או מסננים' : 'חזור מאוחר יותר לתוכן חדש'}
                />
              )}
              {sessionSaved.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-gray-300">מאמרים שנשמרו:</p>
                  <ul className="list-disc list-inside text-gray-400">
                    {sessionSaved.map(a => (
                      <li key={a.id}>{a.title}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-400">לא נשמרו מאמרים בסשן הזה.</p>
              )}
            </div>
          )}
        </div>

        {/* AI Assistant Sidebar */}
        <div className="lg:col-span-1 space-y-3">
          {/* Accordion: Key Takeaways & Connections */}
          {currentArticle && (
            <div className="space-y-2">
              {/* נקודות מפתח */}
              <div className="bg-gray-dark rounded-lg border border-gray-light overflow-hidden">
                <motion.button
                  onClick={() => setOpenSection(openSection === 'takeaways' ? null : 'takeaways')}
                  className="w-full p-3 flex items-center justify-between hover:bg-gray-medium transition-colors"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <h3 className="text-sm font-bold text-gradient font-sans">🔑 נקודות מפתח</h3>
                  <motion.span
                    animate={{ rotate: openSection === 'takeaways' ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-primary"
                  >
                    ▼
                  </motion.span>
                </motion.button>
                
                <AnimatePresence>
                  {openSection === 'takeaways' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3">
                        <KeyTakeaways articleId={currentArticle.id} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* קשרים */}
              <div className="bg-gray-dark rounded-lg border border-gray-light overflow-hidden">
                <motion.button
                  onClick={() => setOpenSection(openSection === 'connections' ? null : 'connections')}
                  className="w-full p-3 flex items-center justify-between hover:bg-gray-medium transition-colors"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <h3 className="text-sm font-bold text-gradient font-sans">🕸️ קשרים</h3>
                  <motion.span
                    animate={{ rotate: openSection === 'connections' ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-primary"
                  >
                    ▼
                  </motion.span>
                </motion.button>
                
                <AnimatePresence>
                  {openSection === 'connections' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3">
                        <ConnectionsSidebar articleId={currentArticle.id} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* AI Assistant */}
          <div className="card p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold font-sans text-gradient">עוזר AI</h3>
              <button
                onClick={() => setDevilsAdvocateMode(!devilsAdvocateMode)}
                className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                  devilsAdvocateMode 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-medium text-gray-400 hover:bg-gray-light'
                }`}
                title="מצב סניגור השטן - AI יאתגר את הטענות של המאמר"
              >
                {devilsAdvocateMode ? '😈' : '🤔'}
              </button>
            </div>
            
            {/* Question Input */}
            <div className="mb-3">
              <textarea
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder={devilsAdvocateMode 
                  ? "ה-AI יאתגר..." 
                  : "שאל שאלה..."}
                className="input w-full h-16 resize-none text-xs"
                disabled={!currentArticle}
              />
              <button
                onClick={handleAskAI}
                disabled={!aiQuestion.trim() || !currentArticle}
                className="btn-primary mt-2 w-full disabled:opacity-50 disabled:cursor-not-allowed text-xs py-1.5"
              >
                {devilsAdvocateMode ? 'אתגר' : 'שאל'}
              </button>
            </div>
            
            {/* AI Responses */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {aiResponses.length > 0 ? (
                aiResponses.map((response, idx) => (
                  <div key={idx} className="border-t border-gray-light pt-2">
                    <p className="text-xs text-gradient font-semibold mb-0.5 font-sans">ש: {response.question}</p>
                    <p className="text-xs text-gray-300 font-serif leading-snug">ת: {response.answer}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">
                  שאל שאלות...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Toasts */}
      <ToastView toasts={toasts} removeToast={removeToast} />
    </div>
    </PageTransition>
  );
};

export default DiscoveryPage;
