import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { booksAPI, summariesAPI } from '../api';
import { googleDriveAPI } from '../api/googleDrive';
import { GoogleDrivePicker } from '../components/GoogleDrivePicker';
import { SummaryBubble } from '../components/SummaryBubble';
import SummaryAI from '../components/SummaryAI';
import { useIsMobile } from '../hooks/useMediaQuery';

interface Book {
  id: string;
  title: string;
  author: string;
  tags: string[];
  readingStatus: string;
  createdAt: string;
  summaries?: Summary[];
}

interface Summary {
  id: string;
  bookId: string;
  title: string;
  content: string;
  keyTakeaways?: string[];
  personalNotes?: string;
  rating?: number;
  googleDriveFileId?: string;
  googleDriveMetadata?: any;
  createdAt: string;
  importedFrom?: string;
}

const EnhancedLibraryPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [driveConnected, setDriveConnected] = useState(false);
  const [filter, setFilter] = useState<'all' | 'reading' | 'completed' | 'want_to_read'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const isMobile = useIsMobile();
  useEffect(() => {
    loadBooks();
    checkDriveStatus();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const data = await booksAPI.getAll();
      // Map API Book (bookTitle, summaries fields) into local Book interface
      const mapped = data.map((b: any) => ({
        id: b.id,
        title: b.bookTitle,
        author: b.author || '',
        tags: [],
        readingStatus: 'all',
        createdAt: b.createdAt,
        summaries: (b.summaries || []).map((s: any) => ({
          id: s.id,
          bookId: s.bookId,
          title: s.chapterTitle || '',
          content: s.content,
          keyTakeaways: undefined,
          personalNotes: undefined,
          rating: undefined,
          googleDriveFileId: undefined,
          googleDriveMetadata: undefined,
          createdAt: s.createdAt,
          importedFrom: undefined,
        })),
      }));
      setBooks(mapped);
    } catch (error) {
      console.error('Failed to load books:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkDriveStatus = async () => {
    try {
      const status = await googleDriveAPI.getStatus();
      setDriveConnected(status.connected);
    } catch (error) {
      console.error('Failed to check Drive status:', error);
    }
  };

  const loadSummaries = async (bookId: string) => {
    try {
      const data = await summariesAPI.getByBookId(bookId);
      const mapped: Summary[] = data.map((s: any) => ({
        id: s.id,
        bookId: s.bookId,
        title: s.chapterTitle || '',
        content: s.content,
        keyTakeaways: undefined,
        personalNotes: undefined,
        rating: undefined,
        googleDriveFileId: undefined,
        googleDriveMetadata: undefined,
        createdAt: s.createdAt,
        importedFrom: undefined,
      }));
      setSummaries(mapped);
    } catch (error) {
      console.error('Failed to load summaries:', error);
    }
  };

  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
    loadSummaries(book.id);
  };

  const handleImportSuccess = () => {
    loadBooks();
    setShowDrivePicker(false);
  };

  const filteredBooks = books.filter(book => {
    const matchesFilter = filter === 'all' || book.readingStatus === filter;
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statusFilters = [
    { value: 'all', label: 'הכל', emoji: '📚' },
    { value: 'reading', label: 'קורא כעת', emoji: '📖' },
    { value: 'completed', label: 'סיימתי', emoji: '✅' },
    { value: 'want_to_read', label: 'רוצה לקרוא', emoji: '📝' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-12 gap-6'}`}>
      {/* Sidebar / Top Actions on Mobile */}
      <div className={`${isMobile ? 'w-full' : 'col-span-3'} space-y-4`}>
        {/* Import Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowDrivePicker(true)}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2"
        >
          <span className="text-xl">☁️</span>
          ייבא מ-Google Drive
          {driveConnected && <span className="bg-green-400 w-2 h-2 rounded-full animate-pulse" />}
        </motion.button>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="חיפוש ספרים..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pr-10 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Status Filters */}
        <div className={`${isMobile ? 'flex overflow-x-auto gap-2 pb-2' : 'space-y-2'}`}>
          {statusFilters.map((status) => (
            <motion.button
              key={status.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(status.value as any)}
              className={`
                ${isMobile ? 'px-4 py-2 whitespace-nowrap' : 'w-full p-3'}
                rounded-lg font-medium transition-all flex items-center gap-2
                ${filter === status.value 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }
              `}
            >
              <span>{status.emoji}</span>
              {status.label}
              <span className="text-xs opacity-70">
                ({books.filter(b => status.value === 'all' || b.readingStatus === status.value).length})
              </span>
            </motion.button>
          ))}
        </div>

        {/* Stats */}
        {!isMobile && (
          <div className="bg-gray-800 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-gray-300">סטטיסטיקות</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">סה"כ ספרים:</span>
                <span className="font-medium">{books.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">סיכומים:</span>
                <span className="font-medium">{books.reduce((acc, b) => acc + (b.summaries?.length || 0), 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">מ-Google Drive:</span>
                <span className="font-medium">
                  {books.filter(b => b.summaries?.some(s => s.importedFrom === 'google_drive')).length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={`${isMobile ? 'w-full' : 'col-span-9'} space-y-6`}>
        {/* Books Grid */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              {searchTerm ? 'לא נמצאו ספרים התואמים את החיפוש' : 'עדיין אין ספרים בספרייה'}
            </h3>
            <p className="text-gray-400">
              {searchTerm ? 'נסה לחפש משהו אחר' : 'התחל על ידי ייבוא סיכומים מ-Google Drive'}
            </p>
          </div>
        ) : (
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'} gap-4`}>
            {filteredBooks.map((book) => (
              <motion.div
                key={book.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                onClick={() => handleBookSelect(book)}
                className={`
                  bg-gray-800 rounded-xl p-4 cursor-pointer transition-all
                  ${selectedBook?.id === book.id ? 'ring-2 ring-blue-500' : 'hover:bg-gray-700'}
                `}
              >
                <h4 className="font-semibold text-lg mb-1">{book.title}</h4>
                <p className="text-gray-400 text-sm mb-3">{book.author}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {book.tags.slice(0, 2).map((tag, i) => (
                      <span key={i} className="text-xs bg-gray-700 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                    {book.tags.length > 2 && (
                      <span className="text-xs text-gray-500">+{book.tags.length - 2}</span>
                    )}
                  </div>
                  
                  {book.summaries && book.summaries.length > 0 && (
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                      {book.summaries.length} סיכומים
                    </span>
                  )}
                </div>

                {book.summaries?.some(s => s.importedFrom === 'google_drive') && (
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <span>☁️</span>
                    יובא מ-Drive
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Selected Book Summaries */}
        {selectedBook && summaries.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8"
          >
            <h3 className="text-2xl font-bold mb-6">
              סיכומים עבור "{selectedBook.title}"
            </h3>
            
            <div className="space-y-6">
              {summaries.map((summary) => (
                <div key={summary.id} className="space-y-3">
                  <SummaryBubble
                    title={summary.title}
                    bookTitle={selectedBook.title}
                    bookAuthor={selectedBook.author}
                    content={summary.content}
                    keyTakeaways={summary.keyTakeaways}
                    personalNotes={summary.personalNotes}
                    rating={summary.rating}
                    createdAt={summary.createdAt}
                    sourceType={summary.importedFrom as any}
                    googleDriveLink={summary.googleDriveMetadata?.webViewLink}
                    relatedTopics={selectedBook.tags}
                    onTopicClick={(topic) => setSearchTerm(topic)}
                  />
                  <SummaryAI summaryId={summary.id} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
      <GoogleDrivePicker
        isOpen={showDrivePicker}
        onClose={() => setShowDrivePicker(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
};

export default EnhancedLibraryPage;