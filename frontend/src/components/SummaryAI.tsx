import React, { useState, Suspense, lazy } from 'react';
import apiClient from '../api/client';
const MarkdownView = lazy(() => import('../components/MarkdownView'));
interface SummaryAIProps {
  summaryId: string;
}

const SummaryAI: React.FC<SummaryAIProps> = ({ summaryId }) => {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [shortText, setShortText] = useState('');
  const [loadingAsk, setLoadingAsk] = useState(false);
  const [loadingShort, setLoadingShort] = useState(false);

  const onAsk = async () => {
    if (!question.trim()) return;
    try {
      setLoadingAsk(true);
      const res = await apiClient.post('/ai/summary/ask', { summaryId, question });
      setAnswer(res.data.answer || '');
      setShortText('');
      setQuestion('');
      setOpen(true);
    } catch (e) {
      setAnswer('לא ניתן לשאול את ה-AI כרגע. ודא שמפתח ה-AI מוגדר בהגדרות.');
    } finally {
      setLoadingAsk(false);
    }
  };

  const onShorten = async () => {
    try {
      setLoadingShort(true);
      const res = await apiClient.post('/ai/summary/shorten', { summaryId, length: 'short' });
      setShortText(res.data.summary || '');
      setAnswer('');
      setOpen(true);
    } catch (e) {
      setShortText('לא ניתן לקצר כרגע. ודא שמפתח ה-AI מוגדר בהגדרות.');
    } finally {
      setLoadingShort(false);
    }
  };

  return (
    <div className="mt-3 p-3 rounded-xl border border-white/15 bg-white/5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-300 font-medium">🤖 AI</div>
        <button onClick={() => setOpen(!open)} className="text-primary text-sm">
          {open ? 'הסתר' : 'פתח'}
        </button>
      </div>
      {open && (
        <div className="mt-3 space-y-3">
          <div className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="שאלה על הסיכום..."
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm"
            />
            <button onClick={onAsk} disabled={loadingAsk || !question.trim()} className="px-3 py-2 rounded-lg bg-primary text-white text-sm disabled:opacity-50">
              {loadingAsk ? 'שולח...' : 'שאל'}
            </button>
            <button onClick={onShorten} disabled={loadingShort} className="px-3 py-2 rounded-lg bg-gray-800 text-gray-100 text-sm disabled:opacity-50">
              {loadingShort ? 'מקצר...' : 'קצר'}
            </button>
          </div>
          {(answer || shortText) && (
            <div className="bg-gray-50/70 rounded-lg p-3 border border-gray-200">
              {answer && (
                <div className="mb-2">
                  <div className="text-xs text-gray-500 mb-1">תשובת AI:</div>
                  <Suspense fallback={<div className="text-xs text-gray-500">טוען תשובה...</div>}>
                    <MarkdownView markdown={answer} />
                  </Suspense>
                </div>
              )}
              {shortText && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">סיכום קצר:</div>
                  <Suspense fallback={<div className="text-xs text-gray-500">טוען סיכום קצר...</div>}>
                    <MarkdownView markdown={shortText} />
                  </Suspense>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SummaryAI;
