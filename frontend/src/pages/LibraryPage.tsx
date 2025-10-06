import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import BookItem from '../components/BookItem';
import RichTextEditor from '../components/RichTextEditor';
import ConceptCloud from '../components/ConceptCloud';
import axios from 'axios';
import DOMPurify from 'dompurify';
import SummaryAI from '../components/SummaryAI';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/Toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Book {
  id: string;
  bookTitle: string;
  currentPage: number;
  totalPages?: number;
  author?: string;
  isbn?: string;
  summaries?: Summary[];
}

interface Summary {
  id: string;
  bookId: string;
  content: string;
  chapterNumber?: number;
  chapterTitle?: string;
  pageRange?: string;
}

const LibraryPage = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [, setSelectedSummary] = useState<Summary | null>(null);
  const [showAddBook, setShowAddBook] = useState(false);
  const [showAddSummary, setShowAddSummary] = useState(false);
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [selectedDriveFile, setSelectedDriveFile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSummaries, setExpandedSummaries] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState<'all'|'reading'|'completed'>('all');
  const { toasts, addToast, removeToast, ToastContainer: ToastView } = useToast();
  
  // Form states
  const [newBook, setNewBook] = useState({
    bookTitle: '',
    currentPage: 0,
    totalPages: '',
    author: '',
    isbn: '',
  });
  
  const [newSummary, setNewSummary] = useState({
    content: '',
    chapterNumber: '',
    chapterTitle: '',
    pageRange: '',
  });

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    if (selectedBook) {
      fetchSummaries(selectedBook.id);
    }
  }, [selectedBook]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/books`);
      setBooks(response.data);
    } catch (error) {
      console.error('Error fetching books:', error);
      // Mock data for demo
      setBooks([
        {
          id: '1',
          bookTitle: 'The Design of Everyday Things',
          currentPage: 150,
          totalPages: 368,
          author: 'Don Norman',
          summaries: [],
        },
        {
          id: '2',
          bookTitle: 'Sapiens: A Brief History of Humankind',
          currentPage: 200,
          totalPages: 443,
          author: 'Yuval Noah Harari',
          summaries: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const bySearch = term
      ? books.filter(b =>
          b.bookTitle.toLowerCase().includes(term) ||
          (b.author || '').toLowerCase().includes(term)
        )
      : books;
    if (tab === 'all') return bySearch;
    if (tab === 'completed') {
      return bySearch.filter(b => (b.totalPages || 0) > 0 && b.currentPage >= (b.totalPages || 0));
    }
    // reading
    return bySearch.filter(b => (b.totalPages || 0) === 0 ? b.currentPage > 0 : b.currentPage < (b.totalPages || 0));
  }, [books, searchTerm, tab]);

  const fetchSummaries = async (bookId: string) => {
    try {
      const response = await axios.get(`${API_BASE}/summaries/book/${bookId}`);
      setSummaries(response.data);
    } catch (error) {
      console.error('Error fetching summaries:', error);
      setSummaries([]);
    }
  };

  const handleAddBook = async () => {
    try {
      const response = await axios.post(`${API_BASE}/books`, {
        ...newBook,
        totalPages: newBook.totalPages ? parseInt(newBook.totalPages) : undefined,
      });
      setBooks([response.data, ...books]);
      setNewBook({ bookTitle: '', currentPage: 0, totalPages: '', author: '', isbn: '' });
      setShowAddBook(false);
      addToast('הספר נוסף בהצלחה', 'success');
    } catch (error) {
      console.error('Error adding book:', error);
      addToast('שגיאה בהוספת ספר', 'error');
    }
  };

  const handleUpdateBook = async (bookId: string, updates: Partial<Book>) => {
    try {
      const response = await axios.put(`${API_BASE}/books/${bookId}`, updates);
      setBooks(books.map(b => b.id === bookId ? response.data : b));
      if (selectedBook?.id === bookId) {
        setSelectedBook(response.data);
      }
      addToast('עודכן בהצלחה', 'success');
    } catch (error) {
      console.error('Error updating book:', error);
      addToast('שגיאה בעדכון ספר', 'error');
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק ספר זה ואת כל הסיכומים שלו?')) return;
    
    try {
      await axios.delete(`${API_BASE}/books/${bookId}`);
      setBooks(books.filter(b => b.id !== bookId));
      if (selectedBook?.id === bookId) {
        setSelectedBook(null);
        setSummaries([]);
      }
      addToast('הספר נמחק', 'success');
    } catch (error) {
      console.error('Error deleting book:', error);
      addToast('שגיאה במחיקת ספר', 'error');
    }
  };

  const handleAddSummary = async () => {
    if (!selectedBook) return;
    
    try {
      const response = await axios.post(`${API_BASE}/summaries`, {
        bookId: selectedBook.id,
        ...newSummary,
        chapterNumber: newSummary.chapterNumber ? parseInt(newSummary.chapterNumber) : undefined,
      });
      setSummaries([...summaries, response.data]);
      setNewSummary({ content: '', chapterNumber: '', chapterTitle: '', pageRange: '' });
      setShowAddSummary(false);
      addToast('הסיכום נוסף', 'success');
    } catch (error) {
      console.error('Error adding summary:', error);
      addToast('שגיאה בהוספת סיכום', 'error');
    }
  };

  const loadDriveFiles = async () => {
    try {
      const response = await axios.get(`${API_BASE}/google-drive/files/recent`);
      const docs = response.data.files.filter((f: any) => 
        f.mimeType === 'application/vnd.google-apps.document'
      );
      setDriveFiles(docs);
    } catch (error) {
      console.error('Error loading Drive files:', error);
    }
  };

  const handleImportFromDrive = async () => {
    if (!selectedDriveFile) return;
    
    try {
      await axios.post(`${API_BASE}/google-drive/import-summary/${selectedDriveFile.id}`, {
        bookTitle: '',
        bookAuthor: '',
        tags: []
      });
      addToast('הייבוא הצליח', 'success');
      setShowDrivePicker(false);
      fetchBooks();
    } catch (error) {
      console.error('Error importing:', error);
      addToast('שגיאה בייבוא הסיכום', 'error');
    }
  };

  const openDrivePicker = () => {
    setShowDrivePicker(true);
    loadDriveFiles();
  };

  return (
    <PageTransition>
    <div className="max-w-7xl mx-auto">
      {/* Concept Cloud */}
      <div className="mb-8">
        <ConceptCloud />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Books List */}
        <div className="lg:col-span-1">
          <div className="flex justify-between items-center mb-4">
            <motion.h2 
              className="text-2xl font-bold font-sans text-gradient"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              📚 הספרים שלי
            </motion.h2>
            <div className="flex gap-2">
              <motion.button
                onClick={openDrivePicker}
                className="bg-gradient-accent hover:bg-gradient-accent-hover text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md hover:shadow-xl transition-all"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                ☁️ יבוא מ-Drive
              </motion.button>
              <motion.button
                onClick={() => setShowAddBook(true)}
                className="btn-primary text-sm"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                + הוסף ספר
              </motion.button>
            </div>
          </div>
          
          {loading ? (
            <motion.div 
              className="card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <p className="text-gray-400 font-sans">טוען ספרים...</p>
              </div>
            </motion.div>
          ) : filteredBooks.length > 0 ? (
            <div className="space-y-4">
              {filteredBooks.map((book) => (
                <BookItem
                  key={book.id}
                  book={book}
                  isSelected={selectedBook?.id === book.id}
                  onSelect={() => setSelectedBook(book)}
                  onUpdateProgress={(progress) => handleUpdateBook(book.id, { currentPage: progress })}
                  onDelete={() => handleDeleteBook(book.id)}
                />
              ))}
            </div>
          ) : (
            <motion.div 
              className="card text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <p className="text-gray-400 mb-4 font-serif">עדיין לא הוספת ספרים</p>
              <motion.button
                onClick={() => setShowAddBook(true)}
                className="btn-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                📚 הוסף את הספר הראשון
              </motion.button>
            </motion.div>
          )}
        </div>
        
        {/* Summaries Section */}
        <div className="lg:col-span-2">
          {selectedBook ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <motion.h2 
                  className="text-2xl font-bold font-sans text-gradient"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  📝 סיכומים
                </motion.h2>
                <div className="space-x-2">
                  <motion.button
                    onClick={() => setShowAddSummary(true)}
                    className="btn-primary text-sm"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    + הוסף סיכום
                  </motion.button>
                </div>
              </div>
              
              {summaries.length > 0 ? (
                <div className="space-y-4">
                  {summaries.map((summary) => {
                    const isExpanded = !!expandedSummaries[summary.id];
                    return (
                      <div key={summary.id} className="space-y-3">
                        <div
                          className="card hover:border-primary transition-colors"
                          onClick={() => setSelectedSummary(summary)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              {summary.chapterTitle && (
                                <h3 className="text-lg font-semibold">{summary.chapterTitle}</h3>
                              )}
                              {summary.chapterNumber && (
                                <p className="text-sm text-gray-400 font-sans">פרק {summary.chapterNumber}</p>
                              )}
                              {summary.pageRange && (
                                <p className="text-sm text-gray-400 font-sans">עמודים: {summary.pageRange}</p>
                              )}
                            </div>
                          </div>
                          <div className={`text-gray-300 ${isExpanded ? '' : 'line-clamp-3'} prose prose-invert max-w-none whitespace-pre-wrap`}
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(summary.content) }}
                          />
                          <div className="mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedSummaries(prev => ({ ...prev, [summary.id]: !isExpanded }));
                              }}
                              className="text-primary hover:text-primary/80 text-sm font-semibold"
                            >
                              {isExpanded ? 'הצג פחות' : 'קרא עוד'}
                            </button>
                          </div>
                        </div>
                        <SummaryAI summaryId={summary.id} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <motion.div 
                  className="card text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <p className="text-gray-400 mb-4 font-serif">עדיין אין סיכומים לספר זה</p>
                  <motion.button
                    onClick={() => setShowAddSummary(true)}
                    className="btn-primary"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    📝 הוסף סיכום ראשון
                  </motion.button>
                </motion.div>
              )}
            </>
          ) : (
            <motion.div 
              className="card h-96 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-center">
                <p className="text-6xl mb-4">📖</p>
                <p className="text-gray-400 font-serif">בחר ספר כדי לראות את הסיכומים</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Add Book Modal */}
      <AnimatePresence>
      {showAddBook && (
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bg-gray-dark rounded-lg p-6 w-full max-w-md border border-gray-light"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            <h3 className="text-xl font-bold mb-4 font-sans text-gradient">📚 הוסף ספר חדש</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="שם הספר *"
                value={newBook.bookTitle}
                onChange={(e) => setNewBook({ ...newBook, bookTitle: e.target.value })}
                className="input w-full"
              />
              <input
                type="text"
                placeholder="מחבר"
                value={newBook.author}
                onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                className="input w-full"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="עמוד נוכחי"
                  value={newBook.currentPage || ''}
                  onChange={(e) => setNewBook({ ...newBook, currentPage: parseInt(e.target.value) || 0 })}
                  className="input w-full"
                />
                <input
                  type="number"
                  placeholder="סה״כ עמודים"
                  value={newBook.totalPages}
                  onChange={(e) => setNewBook({ ...newBook, totalPages: e.target.value })}
                  className="input w-full"
                />
              </div>
              <input
                type="text"
                placeholder="ISBN"
                value={newBook.isbn}
                onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                className="input w-full"
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <motion.button
                onClick={() => setShowAddBook(false)}
                className="btn-secondary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ביטול
              </motion.button>
              <motion.button
                onClick={handleAddBook}
                disabled={!newBook.bookTitle}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: newBook.bookTitle ? 1.05 : 1 }}
                whileTap={{ scale: newBook.bookTitle ? 0.95 : 1 }}
              >
                הוסף ספר
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
      
      {/* Add Summary Modal */}
      <AnimatePresence>
      {showAddSummary && selectedBook && (
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bg-gray-dark rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-light"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            <h3 className="text-xl font-bold mb-4 font-sans text-gradient">📝 הוסף סיכום לספר "{selectedBook.bookTitle}"</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="כותרת הפרק"
                  value={newSummary.chapterTitle}
                  onChange={(e) => setNewSummary({ ...newSummary, chapterTitle: e.target.value })}
                  className="input w-full"
                />
                <input
                  type="number"
                  placeholder="מספר פרק"
                  value={newSummary.chapterNumber}
                  onChange={(e) => setNewSummary({ ...newSummary, chapterNumber: e.target.value })}
                  className="input w-full"
                />
              </div>
              <input
                type="text"
                placeholder="טווח עמודים (לדוגמה: 20-45)"
                value={newSummary.pageRange}
                onChange={(e) => setNewSummary({ ...newSummary, pageRange: e.target.value })}
                className="input w-full"
              />
              <div>
                <label className="block text-sm text-gray-400 mb-2 font-sans">תוכן הסיכום *</label>
                <RichTextEditor
                  content={newSummary.content}
                  onChange={(content) => setNewSummary({ ...newSummary, content })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <motion.button
                onClick={() => setShowAddSummary(false)}
                className="btn-secondary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ביטול
              </motion.button>
              <motion.button
                onClick={handleAddSummary}
                disabled={!newSummary.content}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: newSummary.content ? 1.05 : 1 }}
                whileTap={{ scale: newSummary.content ? 0.95 : 1 }}
              >
                הוסף סיכום
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Google Drive Picker Modal */}
      {showDrivePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDrivePicker(false)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
              <h2 className="text-xl font-bold">ייבא סיכום מ-Google Drive</h2>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
              {driveFiles.length === 0 ? (
                <p className="text-center text-gray-500 py-8">טוען קבצים...</p>
              ) : (
                <div className="space-y-2">
                  {driveFiles.map(file => (
                    <div
                      key={file.id}
                      onClick={() => setSelectedDriveFile(file)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedDriveFile?.id === file.id 
                          ? 'bg-blue-100 border-2 border-blue-500' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">{new Date(file.modifiedTime).toLocaleDateString('he-IL')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowDrivePicker(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                ביטול
              </button>
              <button
                onClick={handleImportFromDrive}
                disabled={!selectedDriveFile}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ייבא סיכום
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Floating Add Button */}
      <button
        onClick={() => setShowAddBook(true)}
        className="fixed bottom-6 left-6 bg-gradient-accent hover:bg-gradient-accent-hover text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-3xl"
        aria-label="הוסף ספר"
        title="הוסף ספר"
      >
        +
      </button>

      {/* Toasts */}
      <ToastView toasts={toasts} removeToast={removeToast} />
    </div>
    </PageTransition>
  );
};

export default LibraryPage;
