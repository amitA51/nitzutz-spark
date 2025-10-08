import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '../api/client';
import { googleDriveAPI } from '../api/googleDrive';
import type { GoogleDriveStatus } from '../api/googleDrive';
import GradientButton from '../components/GradientButton';
import PageTransition from '../components/PageTransition';

function SettingsPage() {
  const [aiResult, setAiResult] = useState<{ success?: boolean; provider?: string; sample?: string; error?: string } | null>(null);

  // Google Drive status
  const { data: driveStatus, refetch: refetchDriveStatus, isFetching: driveLoading } = useQuery<GoogleDriveStatus>({
    queryKey: ['google-drive-status'],
    queryFn: () => googleDriveAPI.getStatus(),
  });

  const connectDrive = useMutation({
    mutationFn: async () => {
      const ok = await googleDriveAPI.connectWithPopup();
      if (!ok) throw new Error('Failed to connect Google Drive');
    },
    onSuccess: () => {
      refetchDriveStatus();
    },
  });

  const disconnectDrive = useMutation({
    mutationFn: async () => googleDriveAPI.disconnect(),
    onSuccess: () => {
      refetchDriveStatus();
    },
  });

  const testAI = async () => {
    setAiResult(null);
    try {
      const res = await apiClient.post('/ai/test-connection');
      setAiResult({ success: true, provider: res.data.provider, sample: res.data.sample });
    } catch (e: any) {
      setAiResult({ success: false, error: e?.response?.data?.error || e?.message || 'Failed to test AI' });
    }
  };

  return (
    <PageTransition>
    <motion.div 
      className="max-w-5xl mx-auto space-y-8"
    >
      {/* Page Title */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-3xl font-bold text-gradient font-sans mb-2">⚙️ הגדרות</h1>
        <p className="text-gray-400 font-serif">נהל את החיבורים והאינטגרציות שלך</p>
      </motion.div>

      {/* AI Settings Section */}
      <motion.section 
        className="card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        whileHover={{ borderColor: 'rgba(59, 130, 246, 0.5)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">🤖</div>
          <h2 className="text-2xl font-bold font-sans text-gradient">הגדרות AI</h2>
        </div>
        <p className="text-gray-400 mb-4 font-serif">בדוק חיבור למנוע ה-AI שהוגדר בצד השרת.</p>
        <div className="flex items-center gap-3">
          <GradientButton onClick={testAI}>
            🔍 בדיקת חיבור
          </GradientButton>
          {aiResult && (
            <motion.div 
              className="text-sm font-sans"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {aiResult.success ? (
                <div className="flex items-center gap-2 text-green-400">
                  <span>✅</span>
                  <span>
                    מחובר ל: <span className="text-gradient font-semibold">{aiResult.provider}</span>
                    {aiResult.sample && <span className="text-gray-400"> · דוגמה: {aiResult.sample}</span>}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-400">
                  <span>❌</span>
                  <span>שגיאה: {aiResult.error}</span>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* Google Drive Section */}
      <motion.section 
        className="card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        whileHover={{ borderColor: 'rgba(59, 130, 246, 0.5)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">☁️</div>
          <h2 className="text-2xl font-bold font-sans text-gradient">Google Drive</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gray-300 font-sans">סטטוס:</span>
              {driveLoading ? (
                <motion.div 
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <span className="text-gray-400 font-sans">בודק...</span>
                </motion.div>
              ) : driveStatus?.connected ? (
                <motion.span 
                  className="text-green-400 font-semibold font-sans flex items-center gap-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring' }}
                >
                  <span>✅</span> מחובר
                </motion.span>
              ) : (
                <span className="text-gray-400 font-sans">מנותק</span>
              )}
            </div>
            <p className="text-gray-400 text-sm font-serif">ניתן לייבא סיכומים ישירות מהדוקומנטים שלך.</p>
          </div>
          <div className="flex gap-2">
            {driveStatus?.connected ? (
              <GradientButton 
                onClick={() => disconnectDrive.mutate()} 
                variant="secondary"
              >
                🚫 התנתק
              </GradientButton>
            ) : (
              <GradientButton 
                onClick={() => connectDrive.mutate()}
                variant="primary"
              >
                🔗 התחבר
              </GradientButton>
            )}
          </div>
        </div>
      </motion.section>
    </motion.div>
    </PageTransition>
  );
}

export default SettingsPage;
