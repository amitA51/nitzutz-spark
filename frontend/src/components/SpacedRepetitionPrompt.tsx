import React, { useState } from 'react';
import axios from 'axios';

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
    { days: 1, label: '1 day' },
    { days: 3, label: '3 days' },
    { days: 7, label: '1 week' },
    { days: 14, label: '2 weeks' },
    { days: 30, label: '1 month' },
    { days: 90, label: '3 months' },
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
      alert('Failed to schedule reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-dark rounded-lg border border-gray-light max-w-md w-full p-6">
        <h3 className="text-xl font-bold mb-2 text-primary">📅 Remember This?</h3>
        <p className="text-sm text-gray-300 mb-4">
          Schedule reminders to review key ideas from <span className="font-semibold">"{articleTitle}"</span> and strengthen your long-term memory.
        </p>

        <div className="space-y-3 mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-wide">When should we remind you?</p>
          <div className="grid grid-cols-2 gap-2">
            {intervalOptions.map(({ days, label }) => (
              <button
                key={days}
                onClick={() => toggleInterval(days)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  selectedIntervals.includes(days)
                    ? 'bg-primary text-white'
                    : 'bg-gray-medium text-gray-400 hover:bg-gray-light'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-medium hover:bg-gray-light text-white rounded-lg transition-colors"
            disabled={loading}
          >
            Skip
          </button>
          <button
            onClick={handleSchedule}
            className="flex-1 btn-primary"
            disabled={loading || selectedIntervals.length === 0}
          >
            {loading ? 'Scheduling...' : 'Schedule Reviews'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpacedRepetitionPrompt;
