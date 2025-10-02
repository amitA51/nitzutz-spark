import { useState, useEffect } from 'react';
import ArticleCard from '../components/ArticleCard';
import KeyTakeaways from '../components/KeyTakeaways';
import ConnectionsSidebar from '../components/ConnectionsSidebar';
import SpacedRepetitionPrompt from '../components/SpacedRepetitionPrompt';
import axios from 'axios';

interface Article {
  id: string;
  title: string;
  content: string;
  author?: string;
  category: string;
  excerpt?: string;
  readTime?: number;
  imageUrl?: string;
  isSaved: boolean;
}

const DiscoveryPage = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>(['all']);
  const [loading, setLoading] = useState(true);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponses, setAiResponses] = useState<any[]>([]);
  const [devilsAdvocateMode, setDevilsAdvocateMode] = useState(false);
  const [showRepetitionPrompt, setShowRepetitionPrompt] = useState(false);
  const [repetitionArticle, setRepetitionArticle] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, [selectedCategory]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const params = selectedCategory !== 'all' ? { category: selectedCategory } : {};
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/articles`, { params });
      setArticles(response.data.articles || []);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error fetching articles:', error);
      // Use dummy data for demo
      setArticles([
        {
          id: '1',
          title: 'The Future of Artificial Intelligence',
          content: 'Artificial intelligence continues to evolve at a rapid pace...',
          author: 'Dr. Sarah Johnson',
          category: 'Technology',
          excerpt: 'Exploring the latest developments in AI and their implications.',
          readTime: 8,
          isSaved: false,
        },
        {
          id: '2',
          title: 'Understanding Quantum Computing',
          content: 'Quantum computing represents a fundamental shift in how we process information...',
          author: 'Prof. Michael Chen',
          category: 'Science',
          excerpt: 'A beginner-friendly introduction to quantum computing concepts.',
          readTime: 12,
          isSaved: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/articles/categories/list`);
      setCategories(['all', ...response.data]);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories(['all', 'Technology', 'Science', 'Philosophy', 'Environment', 'Mathematics']);
    }
  };

  const handleSaveArticle = async () => {
    if (!articles[currentIndex]) return;
    
    try {
      const article = articles[currentIndex];
      if (article.isSaved) {
        await axios.delete(`${import.meta.env.VITE_API_URL}/saved-articles/${article.id}`);
        // Update local state
        const updatedArticles = [...articles];
        updatedArticles[currentIndex] = { ...article, isSaved: false };
        setArticles(updatedArticles);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/saved-articles`, {
          articleId: article.id,
        });
        // Update local state
        const updatedArticles = [...articles];
        updatedArticles[currentIndex] = { ...article, isSaved: true };
        setArticles(updatedArticles);
        
        // Show spaced repetition prompt
        setRepetitionArticle({ id: article.id, title: article.title });
        setShowRepetitionPrompt(true);
      }
    } catch (error) {
      console.error('Error saving article:', error);
    }
  };

  const handleAskAI = async () => {
    if (!aiQuestion.trim() || !articles[currentIndex]) return;
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/ai/ask`, {
        articleId: articles[currentIndex].id,
        question: aiQuestion,
        mode: devilsAdvocateMode ? 'devils-advocate' : 'normal',
      });
      
      setAiResponses([response.data, ...aiResponses]);
      setAiQuestion('');
    } catch (error) {
      console.error('Error asking AI:', error);
      // Mock response for demo
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

  const currentArticle = articles[currentIndex];

  return (
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
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedCategory === cat
                      ? 'bg-primary text-white'
                      : 'bg-gray-medium hover:bg-gray-light text-gray-300'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Article Display */}
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-400">Loading articles...</p>
            </div>
          ) : currentArticle ? (
            <>
              <ArticleCard article={currentArticle} />
              
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
                  {currentIndex + 1} / {articles.length}
                </span>
                
                <button
                  onClick={() => setCurrentIndex(Math.min(articles.length - 1, currentIndex + 1))}
                  disabled={currentIndex === articles.length - 1}
                  className={`btn-secondary ${currentIndex === articles.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-400">No articles available</p>
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
              <h3 className="text-xl font-semibold">AI Assistant</h3>
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
                    <p className="text-sm text-primary font-medium mb-1">Q: {response.question}</p>
                    <p className="text-sm text-gray-300">A: {response.answer}</p>
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
  );
};

export default DiscoveryPage;
