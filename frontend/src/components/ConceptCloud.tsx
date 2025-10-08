import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

interface Concept {
  concept: string;
  count: number;
  category?: string;
  relatedTo?: string[];
}

type ViewMode = 'cloud' | 'list' | 'graph';
type FilterCategory = 'all' | 'tech' | 'philosophy' | 'science' | 'security' | 'other';

const ConceptCloud: React.FC = () => {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('cloud');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [showInsights, setShowInsights] = useState(false);

  useEffect(() => {
    const fetchConcepts = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/ai/concept-cloud`);
        setConcepts(response.data.concepts || []);
      } catch (error) {
        console.error('Error fetching concept cloud:', error);
        // Fallback to mock data for demo
        setConcepts([
          { concept: 'בינה מלאכותית', count: 15, category: 'tech', relatedTo: ['Machine Learning', 'Deep Learning'] },
          { concept: 'AI Ethics', count: 12, category: 'philosophy', relatedTo: ['פילוסופיה'] },
          { concept: 'Machine Learning', count: 10, category: 'tech', relatedTo: ['בינה מלאכותית', 'Neural Networks'] },
          { concept: 'אבטחת מידע', count: 8, category: 'security', relatedTo: [] },
          { concept: 'Deep Learning', count: 7, category: 'tech', relatedTo: ['בינה מלאכותית', 'Neural Networks'] },
          { concept: 'פילוסופיה', count: 6, category: 'philosophy', relatedTo: ['AI Ethics', 'פסיכולוגיה'] },
          { concept: 'Neural Networks', count: 5, category: 'tech', relatedTo: ['Machine Learning', 'Deep Learning'] },
          { concept: 'פסיכולוגיה', count: 4, category: 'science', relatedTo: ['פילוסופיה'] },
          { concept: 'Blockchain', count: 6, category: 'tech', relatedTo: ['אבטחת מידע'] },
          { concept: 'חינוך', count: 5, category: 'other', relatedTo: ['פסיכולוגיה'] },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchConcepts();
  }, []);

  // Filtered and searched concepts
  const filteredConcepts = useMemo(() => {
    return concepts.filter(c => {
      const matchesSearch = searchQuery === '' || 
        c.concept.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'all' || c.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [concepts, searchQuery, filterCategory]);

  // Get insights
  const insights = useMemo(() => {
    if (concepts.length === 0) return null;
    
    const topConcept = concepts[0];
    const categoryCount = concepts.reduce((acc, c) => {
      acc[c.category || 'other'] = (acc[c.category || 'other'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];
    
    return {
      topConcept: topConcept.concept,
      topCategory: topCategory[0],
      totalMentions: concepts.reduce((sum, c) => sum + c.count, 0),
      avgMentions: Math.round(concepts.reduce((sum, c) => sum + c.count, 0) / concepts.length),
    };
  }, [concepts]);

  if (loading) {
    return (
      <motion.div 
        className="bg-gradient-to-br from-gray-dark via-gray-medium/30 to-gray-dark rounded-2xl p-6 border border-primary/20 shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-sans flex items-center gap-2">
          ☁️ ענן הרעיונות שלך
        </h3>
        <div className="flex items-center justify-center py-12">
          <motion.div 
            className="rounded-full h-10 w-10 border-3 border-primary border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </motion.div>
    );
  }

  if (concepts.length === 0) {
    return (
      <motion.div 
        className="bg-gradient-to-br from-gray-dark via-gray-medium/30 to-gray-dark rounded-2xl p-8 border border-primary/20 shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-sans flex items-center gap-2">
          ☁️ ענן הרעיונות שלך
        </h3>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🧠</div>
          <p className="text-sm text-gray-400 font-sans leading-relaxed">
            כשתשמור מאמרים ותוסיף ספרים,<br />
            הרעיונות המרכזיים יופיעו כאן
          </p>
        </div>
      </motion.div>
    );
  }

  const maxCount = Math.max(...concepts.map(c => c.count));
  
  const getFontSize = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.8) return 'text-3xl';
    if (ratio > 0.6) return 'text-2xl';
    if (ratio > 0.4) return 'text-xl';
    if (ratio > 0.2) return 'text-lg';
    return 'text-base';
  };

  const getColor = (count: number, category?: string) => {
    const ratio = count / maxCount;
    
    // Color by category
    if (category === 'tech') return ratio > 0.5 ? 'from-blue-400 to-cyan-400' : 'from-blue-300 to-cyan-300';
    if (category === 'philosophy') return ratio > 0.5 ? 'from-purple-400 to-pink-400' : 'from-purple-300 to-pink-300';
    if (category === 'science') return ratio > 0.5 ? 'from-green-400 to-emerald-400' : 'from-green-300 to-emerald-300';
    if (category === 'security') return ratio > 0.5 ? 'from-red-400 to-orange-400' : 'from-red-300 to-orange-300';
    
    // Default gradient based on frequency
    if (ratio > 0.7) return 'from-blue-400 via-purple-400 to-pink-400';
    if (ratio > 0.5) return 'from-blue-300 to-purple-400';
    if (ratio > 0.3) return 'from-gray-300 to-blue-300';
    return 'from-gray-400 to-gray-300';
  };

  const getScale = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.8) return 1.1;
    if (ratio > 0.6) return 1.05;
    return 1;
  };

  const categoryIcons = {
    tech: '💻',
    philosophy: '🧠',
    science: '🔬',
    security: '🔒',
    other: '📚',
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      tech: 'טכנולוגיה',
      philosophy: 'פילוסופיה',
      science: 'מדע',
      security: 'אבטחה',
      other: 'אחר',
      all: 'הכל',
    };
    return labels[cat] || cat;
  };

  return (
    <motion.div 
      className="bg-gradient-to-br from-gray-dark via-gray-medium/20 to-gray-dark rounded-2xl p-6 border border-primary/20 shadow-xl overflow-hidden relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-sans flex items-center gap-2">
            ☁️ ענן הרעיונות
          </h3>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => setShowInsights(!showInsights)}
              className="text-xs px-3 py-1 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {showInsights ? '👁️ סגור תובנות' : '💡 תובנות'}
            </motion.button>
            <span className="text-xs text-gray-500 font-sans">
              {filteredConcepts.length} / {concepts.length}
            </span>
          </div>
        </div>
        
        {/* Insights Panel */}
        <AnimatePresence>
          {showInsights && insights && (
            <motion.div
              className="mb-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-primary/30 rounded-xl"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400 text-xs mb-1">🏆 מושג מוביל</div>
                  <div className="text-white font-bold">{insights.topConcept}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-1">🎯 קטגוריה עיקרית</div>
                  <div className="text-white font-bold">{getCategoryLabel(insights.topCategory)}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-1">📊 סה"כ אזכורים</div>
                  <div className="text-white font-bold">{insights.totalMentions}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-1">📍 ממוצע</div>
                  <div className="text-white font-bold">{insights.avgMentions}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search and Filters */}
        <div className="mb-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 חפש מושג..."
              className="w-full px-4 py-2 bg-gray-medium/50 border border-gray-light/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors font-sans text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'tech', 'philosophy', 'science', 'security', 'other'] as FilterCategory[]).map((cat) => (
              <motion.button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  filterCategory === cat
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-medium/30 text-gray-400 hover:bg-gray-medium/50 hover:text-gray-200'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {categoryIcons[cat as keyof typeof categoryIcons] || '📚'} {getCategoryLabel(cat)}
              </motion.button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            {(['cloud', 'list'] as ViewMode[]).map((mode) => (
              <motion.button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  viewMode === mode
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                    : 'bg-gray-medium/30 text-gray-400 hover:bg-gray-medium/50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {mode === 'cloud' ? '☁️ ענן' : '📋 רשימה'}
              </motion.button>
            ))}
          </div>
        </div>
        
        {/* Cloud View */}
        {viewMode === 'cloud' && (
          <div className="flex flex-wrap gap-3 justify-center items-center min-h-[250px] py-4">
            {filteredConcepts.map((c, index) => (
              <motion.button
                key={index}
                className={`${
                  getFontSize(c.count)
                } font-bold text-transparent bg-clip-text bg-gradient-to-r ${
                  getColor(c.count, c.category)
                } hover:scale-110 transition-all cursor-pointer px-3 py-1.5 rounded-lg hover:bg-white/5 relative group ${
                  selectedConcept === c.concept ? 'ring-2 ring-primary' : ''
                }`}
                title={`הוזכר ${c.count} פעמים`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: 1, 
                  scale: getScale(c.count),
                }}
                transition={{ 
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 200,
                  damping: 15
                }}
                whileHover={{ 
                  scale: getScale(c.count) * 1.15,
                  rotate: [-1, 1, -1, 0],
                  transition: { duration: 0.3 }
                }}
                whileTap={{ scale: getScale(c.count) * 0.95 }}
                onClick={() => setSelectedConcept(selectedConcept === c.concept ? null : c.concept)}
              >
                {c.concept}
                
                {/* Tooltip on hover */}
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-dark border border-primary/30 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                  {c.count} פעמים • {getCategoryLabel(c.category || 'other')}
                </span>
              </motion.button>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-2">
            {filteredConcepts.map((c, index) => (
              <motion.div
                key={index}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  selectedConcept === c.concept
                    ? 'bg-primary/20 border-primary/50'
                    : 'bg-gray-medium/30 border-gray-light/20 hover:bg-gray-medium/50'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => setSelectedConcept(selectedConcept === c.concept ? null : c.concept)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {categoryIcons[c.category as keyof typeof categoryIcons] || '📚'}
                    </span>
                    <div>
                      <h4 className="font-bold text-white">{c.concept}</h4>
                      <p className="text-xs text-gray-400">
                        {getCategoryLabel(c.category || 'other')} • {c.count} אזכורים
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Popularity bar */}
                    <div className="w-20 h-2 bg-gray-dark rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{ width: `${(c.count / Math.max(...concepts.map(x => x.count))) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 font-mono">{c.count}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Selected Concept Details */}
        <AnimatePresence>
          {selectedConcept && (
            <motion.div
              className="mt-4 p-4 bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/40 rounded-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-lg font-bold text-white mb-1">{selectedConcept}</h4>
                  <p className="text-xs text-gray-400">
                    {concepts.find(c => c.concept === selectedConcept)?.count} אזכורים • 
                    {getCategoryLabel(concepts.find(c => c.concept === selectedConcept)?.category || 'other')}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedConcept(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              
              {/* Related Concepts */}
              {concepts.find(c => c.concept === selectedConcept)?.relatedTo && 
               concepts.find(c => c.concept === selectedConcept)!.relatedTo!.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-light/20">
                  <p className="text-xs text-gray-400 mb-2">🔗 קשור ל:</p>
                  <div className="flex flex-wrap gap-2">
                    {concepts.find(c => c.concept === selectedConcept)!.relatedTo!.map((related, idx) => (
                      <motion.button
                        key={idx}
                        onClick={() => setSelectedConcept(related)}
                        className="px-2 py-1 bg-gray-medium/50 hover:bg-gray-medium text-gray-300 hover:text-white rounded text-xs transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {related}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* No Results */}
        {filteredConcepts.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-gray-400 text-sm">לא נמצאו תוצאות</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('all');
              }}
              className="mt-3 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              אפס סינונים
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ConceptCloud;
