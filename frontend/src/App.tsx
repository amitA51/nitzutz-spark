import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
const LibraryPage = lazy(() => import('./pages/LibraryPage'));
const DiscoveryPage = lazy(() => import('./pages/DiscoveryPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const MentorPage = lazy(() => import('./pages/MentorPage'));
import GooeyNav from './components/GooeyNav';
import { MobileNav } from './components/MobileNav';
import { useIsMobile } from './hooks/useMediaQuery';
import ErrorBoundary from './components/ErrorBoundary';
import { AIContentGenerator } from './components/AIContentGenerator';
import { useQuery } from '@tanstack/react-query';
import { insightsAPI } from './api/insights';


function App() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isMobile = useIsMobile();
  const { data: insightsData } = useQuery({
    queryKey: ['insights-count'],
    queryFn: () => insightsAPI.getAll(),
    refetchInterval: 60000,
  });
  const unviewedCount = insightsData?.unviewedCount || 0;
  const navItems = [
    { label: "מנוע גילויים", href: "/" },
    { label: "הספרייה האישית", href: "/library" },
    { label: unviewedCount > 0 ? `🧠 המנטור (${unviewedCount})` : "🧠 המנטור", href: "/mentor" },
  ];

  return (
    <Router>
      <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground" dir="rtl">
        {/* Mobile Navigation Drawer */}
        <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        
        {/* Navigation Header */}
        <header className="border-b border-gray-light bg-gray-dark sticky top-0 z-30">
          <div className="container mx-auto px-4">
            <nav className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4 md:gap-8">
                {/* Mobile Menu Button */}
                {isMobile && (
                  <button
                    onClick={() => setMobileNavOpen(true)}
                    className="md:hidden text-gray-300 hover:text-white p-2"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                )}
                
                {/* App Title with Gradient */}
                <motion.h1 
                  className="text-xl md:text-2xl font-bold text-gradient font-sans"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  ⚡ ניצוץ
                </motion.h1>
                {/* Desktop Navigation */}
                {!isMobile && <GooeyNav items={navItems} />}
              </div>
              
              {/* Settings Button */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Link to="/settings" className="text-gray-300 hover:text-primary p-2 rounded-lg hover:bg-gray-medium transition-all block">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756.426-1.756 2.924 0 3.35a1.724 1.724 0 001.066 2.573c-.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
              </motion.div>
            </nav>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="container mx-auto px-4 py-4 md:py-8">
          <Suspense fallback={
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center h-64"
            >
              <div className="text-center">
                <motion.div
                  className="w-16 h-16 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <p className="text-gray-400 font-sans">טוען...</p>
              </div>
            </motion.div>
          }>
            <Routes>
              <Route path="/" element={<DiscoveryPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/mentor" element={<MentorPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </Suspense>
        </main>
        
        {/* AI Content Generator - Floating Button */}
        <AIContentGenerator onGenerated={() => {
          // Refresh the page after generating new content
          window.location.reload();
        }} />
      </div>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
