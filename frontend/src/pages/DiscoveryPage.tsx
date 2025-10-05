import { useEffect, useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import ArticleCard from '../components/ArticleCard';
import KeyTakeaways from '../components/KeyTakeaways';
import ConnectionsSidebar from '../components/ConnectionsSidebar';
import SpacedRepetitionPrompt from '../components/SpacedRepetitionPrompt';
import { articlesAPI, type Article } from '../api/articles';
import { savedArticlesAPI } from '../api/savedArticles';
import apiClient from '../api/client';

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

  // Reset deck on data change
  useEffect(() => {
    setDeckArticles(articles);
    setCurrentIndex(0);
    setSessionSaved([]);
  }, [articles]);

  const handleSaveArticle = useCallback(async () => {
    const article = deckArticles[currentIndex];
    if (!article) return;
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
      }
    } catch (error) {
      console.error('Error saving article:', error);
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
          onScheduled={() => console.log('Repetitions scheduled')}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {/* Category Filter */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-gradient-accent text-white shadow-md'
                      : 'bg-gray-medium hover:bg-gray-light text-gray-300'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Article Display: Deck */}
          {articlesQuery.isLoading ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-400">Loading articles...</p>
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
                          SAVE
                        </motion.div>
                        <motion.div
                          className="absolute top-4 right-4 text-gray-400 font-bold text-lg"
                          style={{ opacity: showSkip }}
                        >
                          SKIP
                        </motion.div>
                      </>
                    )}
                  </motion.div>
                ))}
              </div>
              
              {/* Navigation Controls */}
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className={`btn-secondary ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Previous
                </button>
                
                <span className="text-gray-400">
                  {currentIndex + 1} / {deckArticles.length}
                </span>
                
                <button
                  onClick={() => setCurrentIndex(Math.min(deckArticles.length - 1, currentIndex + 1))}
                  disabled={currentIndex === deckArticles.length - 1}
                  className={`btn-secondary ${currentIndex === deckArticles.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Next
                </button>
              </div>
              
              {/* Save Button */}
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleSaveArticle}
                  className={`${currentArticle.isSaved ? 'btn-secondary' : 'btn-primary'} flex items-center space-x-2`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={currentArticle.isSaved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <span>{currentArticle.isSaved ? 'Saved' : 'Save Article'}</span>
                </button>
              </div>
            </>
          ) : (
              <div className="card">
              <h3 className="text-xl font-bold mb-2 font-sans">Session Summary</h3>
              <p className="text-gray-400 mb-4 font-serif">סיימת לעבור על כל המאמרים בסשן הזה.</p>
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
        <div className="lg:col-span-1 space-y-6">
          {/* Key Takeaways */}
          {currentArticle && (
            <KeyTakeaways articleId={currentArticle.id} />
          )}

          {/* Connections - Knowledge Graph */}
          {currentArticle && (
            <ConnectionsSidebar articleId={currentArticle.id} />
          )}

          {/* AI Assistant */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold font-sans">AI Assistant</h3>
              <button
                onClick={() => setDevilsAdvocateMode(!devilsAdvocateMode)}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  devilsAdvocateMode 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-medium text-gray-400 hover:bg-gray-light'
                }`}
                title="Toggle Devil's Advocate Mode - AI will challenge the article's arguments"
              >
                {devilsAdvocateMode ? '😈 Devil\'s Advocate' : '🤔 Normal Mode'}
              </button>
            </div>
            
            {/* Question Input */}
            <div className="mb-4">
              <textarea
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder={devilsAdvocateMode 
                  ? "AI will challenge the article's claims and present counter-arguments..." 
                  : "Ask a question about this article..."}
                className="input w-full h-24 resize-none"
                disabled={!currentArticle}
              />
              <button
                onClick={handleAskAI}
                disabled={!aiQuestion.trim() || !currentArticle}
                className="btn-primary mt-2 w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {devilsAdvocateMode ? 'Challenge This' : 'Ask AI'}
              </button>
            </div>
            
            {/* AI Responses */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {aiResponses.length > 0 ? (
                aiResponses.map((response, idx) => (
                  <div key={idx} className="border-t border-gray-light pt-4">
                    <p className="text-sm text-gradient font-semibold mb-1 font-sans">Q: {response.question}</p>
                    <p className="text-sm text-gray-300 font-serif">A: {response.answer}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400">
                  Ask questions about the article to get AI-powered insights.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </PageTransition>
  );
};

export default DiscoveryPage;
