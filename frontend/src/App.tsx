import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LibraryPage from './pages/LibraryPage';
import DiscoveryPage from './pages/DiscoveryPage';
import GooeyNav from './components/GooeyNav';

const navItems = [
  { label: "Discovery Engine", href: "/" },
  { label: "Personal Library", href: "/library" },
];

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground">
        {/* Navigation Header */}
        <header className="border-b border-gray-light bg-gray-dark">
          <div className="container mx-auto px-4">
            <nav className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                {/* App Title */}
                <h1 className="text-2xl font-bold text-primary">
                  ניצוץ
                </h1>
                
                {/* Gooey Navigation */}
                <GooeyNav items={navItems} />
              </div>
              
              {/* Settings Button */}
              <button className="text-gray-300 hover:text-white p-2 rounded-lg hover:bg-gray-medium transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </nav>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<DiscoveryPage />} />
            <Route path="/library" element={<LibraryPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
