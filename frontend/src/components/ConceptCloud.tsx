import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Concept {
  concept: string;
  count: number;
}

const ConceptCloud: React.FC = () => {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConcepts = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/ai/concept-cloud`);
        setConcepts(response.data.concepts || []);
      } catch (error) {
        console.error('Error fetching concept cloud:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConcepts();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-dark rounded-lg p-6 border border-gray-light">
        <h3 className="text-lg font-semibold mb-4 text-primary">☁️ Your Concept Cloud</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (concepts.length === 0) {
    return (
      <div className="bg-gray-dark rounded-lg p-6 border border-gray-light">
        <h3 className="text-lg font-semibold mb-4 text-primary">☁️ Your Concept Cloud</h3>
        <p className="text-sm text-gray-400 italic">
          As you save articles and add books, key concepts will appear here showing what you're focusing on.
        </p>
      </div>
    );
  }

  const maxCount = Math.max(...concepts.map(c => c.count));
  const getFontSize = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.8) return 'text-2xl';
    if (ratio > 0.6) return 'text-xl';
    if (ratio > 0.4) return 'text-lg';
    if (ratio > 0.2) return 'text-base';
    return 'text-sm';
  };

  const getOpacity = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return 'opacity-100';
    if (ratio > 0.5) return 'opacity-90';
    if (ratio > 0.3) return 'opacity-75';
    return 'opacity-60';
  };

  return (
    <div className="bg-gray-dark rounded-lg p-6 border border-gray-light">
      <h3 className="text-lg font-semibold mb-4 text-primary">☁️ Your Concept Cloud</h3>
      <p className="text-xs text-gray-400 mb-4">
        The concepts you encounter most frequently across your library
      </p>
      <div className="flex flex-wrap gap-3 justify-center items-center min-h-[200px]">
        {concepts.map((c, index) => (
          <span
            key={index}
            className={`${getFontSize(c.count)} ${getOpacity(c.count)} font-medium text-white hover:text-primary transition-colors cursor-pointer`}
            title={`Mentioned ${c.count} times`}
          >
            {c.concept}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ConceptCloud;
