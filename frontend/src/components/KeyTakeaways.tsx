import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface KeyTakeawaysProps {
  articleId: string;
}

const KeyTakeaways: React.FC<KeyTakeawaysProps> = ({ articleId }) => {
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKeyPoints = async () => {
      if (!articleId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/ai/extract-key-points`, {
          articleId,
        });
        setKeyPoints(response.data.keyPoints || []);
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
      <div className="bg-gray-dark rounded-lg p-6 border border-gray-light">
        <h3 className="text-lg font-semibold mb-4 text-primary">🔑 Key Takeaways</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-dark rounded-lg p-6 border border-gray-light">
        <h3 className="text-lg font-semibold mb-4 text-primary">🔑 Key Takeaways</h3>
        <p className="text-sm text-gray-400">{error}</p>
      </div>
    );
  }

  if (keyPoints.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-dark rounded-lg p-6 border border-gray-light">
      <h3 className="text-lg font-semibold mb-4 text-primary">🔑 Key Takeaways</h3>
      <ul className="space-y-3">
        {keyPoints.map((point, index) => (
          <li key={index} className="flex items-start">
            <span className="text-primary font-bold mr-3 mt-0.5 flex-shrink-0">
              {index + 1}.
            </span>
            <span className="text-sm text-gray-300 leading-relaxed">
              {point.replace(/^[-•*]\s*/, '').replace(/^"\s*|\s*"$/g, '')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default KeyTakeaways;
