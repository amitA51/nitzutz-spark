import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import PageTransition from '../components/PageTransition';
import GradientButton from '../components/GradientButton';
import { insightsAPI } from '../api/insights';

const MentorPage = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['insights'],
    queryFn: () => insightsAPI.getAll(),
    refetchOnWindowFocus: false,
  });

  const insights = data?.insights || [];
  const weeklyInsight = insights.find(i => i.type === 'weekly_summary');
  const connections = insights.filter(i => i.type === 'connection');
  const recommendations = insights.filter(i => i.type === 'recommendation');
  const question = insights.find(i => i.type === 'question');

  const handleGenerate = async () => {
    await insightsAPI.generateManually();
    setTimeout(() => refetch(), 3000);
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center h-96">
          <motion.div
            className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold text-gradient font-sans mb-2">
            🧠 המנטור האישי שלך
          </h1>
          <p className="text-gray-400 font-serif">תובנות אישיות המבוססות על מה שלמדת לאחרונה</p>
        </motion.div>

        {/* Weekly summary */}
        {weeklyInsight && (
          <motion.div
            className="card bg-gradient-to-br from-gray-dark to-gray-medium border border-gray-light rounded-xl p-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-2xl font-bold text-gradient mb-4 font-sans">📊 {weeklyInsight.title}</h2>
            <p className="text-gray-300 font-serif text-lg leading-relaxed">{weeklyInsight.content}</p>
          </motion.div>
        )}

        {/* Connections */}
        {connections.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gradient font-sans">🔗 חיבורים מפתיעים</h2>
            {connections.map((conn, index) => (
              <motion.div
                key={conn.id}
                className="card border border-gray-light rounded-xl p-6 hover:border-primary transition-all"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="text-xl font-semibold text-white mb-3 font-sans">{conn.title}</h3>
                <p className="text-gray-300 font-serif leading-relaxed">{conn.content}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gradient font-sans">💡 כיווני למידה מומלצים</h2>
            {recommendations.map((rec, index) => (
              <motion.div
                key={rec.id}
                className="card border border-gray-light rounded-xl p-6 bg-gray-dark"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <h3 className="text-lg font-semibold text-primary mb-2 font-sans">{rec.title}</h3>
                <p className="text-gray-300 font-serif">{rec.content}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Question */}
        {question && (
          <motion.div
            className="card border border-primary rounded-xl p-6 bg-gradient-to-br from-purple-900/20 to-blue-900/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-gradient mb-4 font-sans">🤔 {question.title}</h2>
            <p className="text-gray-200 font-serif text-lg leading-relaxed">{question.content}</p>
          </motion.div>
        )}

        {/* Empty state */}
        {insights.length === 0 && (
          <motion.div className="card text-center py-16 border border-gray-light rounded-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-2xl font-bold text-gray-400 mb-4 font-sans">עדיין אין תובנות</h2>
            <p className="text-gray-400 mb-6 font-serif">המנטור יתחיל לעבוד אחרי שתקרא מספר מאמרים או תוסיף ספרים</p>
            <GradientButton onClick={handleGenerate}>צור תובנות עכשיו (בדיקה)</GradientButton>
          </motion.div>
        )}

        {/* Manual refresh */}
        {insights.length > 0 && (
          <div className="flex justify-center pt-6">
            <GradientButton onClick={handleGenerate} variant="secondary">🔄 רענן תובנות</GradientButton>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default MentorPage;
