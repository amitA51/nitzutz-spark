import { useState, useEffect } from 'react';
import BookItem from '../components/BookItem';
import RichTextEditor from '../components/RichTextEditor';
import ConceptCloud from '../components/ConceptCloud';
import axios from 'axios';

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
  const [loading, setLoading] = useState(true);
  
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
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/books`);
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

  const fetchSummaries = async (bookId: string) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/summaries/book/${bookId}`);
      setSummaries(response.data);
    } catch (error) {
      console.error('Error fetching summaries:', error);
      setSummaries([]);
    }
  };

  const handleAddBook = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/books`, {
        ...newBook,
        totalPages: newBook.totalPages ? parseInt(newBook.totalPages) : undefined,
      });
      setBooks([response.data, ...books]);
      setNewBook({ bookTitle: '', currentPage: 0, totalPages: '', author: '', isbn: '' });
      setShowAddBook(false);
    } catch (error) {
      console.error('Error adding book:', error);
    }
  };

  const handleUpdateBook = async (bookId: string, updates: Partial<Book>) => {
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/books/${bookId}`, updates);
      setBooks(books.map(b => b.id === bookId ? response.data : b));
      if (selectedBook?.id === bookId) {
        setSelectedBook(response.data);
      }
    } catch (error) {
      console.error('Error updating book:', error);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book and all its summaries?')) return;
    
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/books/${bookId}`);
      setBooks(books.filter(b => b.id !== bookId));
      if (selectedBook?.id === bookId) {
        setSelectedBook(null);
        setSummaries([]);
      }
    } catch (error) {
      console.error('Error deleting book:', error);
    }
  };

  const handleAddSummary = async () => {
    if (!selectedBook) return;
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/summaries`, {
        bookId: selectedBook.id,
        ...newSummary,
        chapterNumber: newSummary.chapterNumber ? parseInt(newSummary.chapterNumber) : undefined,
      });
      setSummaries([...summaries, response.data]);
      setNewSummary({ content: '', chapterNumber: '', chapterTitle: '', pageRange: '' });
      setShowAddSummary(false);
    } catch (error) {
      console.error('Error adding summary:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Concept Cloud */}
      <div className="mb-8">
        <ConceptCloud />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Books List */}
        <div className="lg:col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">My Books</h2>
            <button
              onClick={() => setShowAddBook(true)}
              className="btn-primary text-sm"
            >
              Add Book
            </button>
          </div>
          
          {loading ? (
            <div className="card">
              <p className="text-gray-400">Loading books...</p>
            </div>
          ) : books.length > 0 ? (
            <div className="space-y-4">
              {books.map((book) => (
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
            <div className="card text-center">
              <p className="text-gray-400 mb-4">No books added yet</p>
              <button
                onClick={() => setShowAddBook(true)}
                className="btn-primary"
              >
                Add Your First Book
              </button>
            </div>
          )}
        </div>
        
        {/* Summaries Section */}
        <div className="lg:col-span-2">
          {selectedBook ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Summaries</h2>
                <div className="space-x-2">
                  <button
                    onClick={() => setShowAddSummary(true)}
                    className="btn-primary text-sm"
                  >
                    Add Summary
                  </button>
                  <button
                    className="btn-secondary text-sm"
                    disabled
                  >
                    Import from Drive
                  </button>
                </div>
              </div>
              
              {summaries.length > 0 ? (
                <div className="space-y-4">
                  {summaries.map((summary) => (
                    <div
                      key={summary.id}
                      className="card cursor-pointer hover:border-primary transition-colors"
                      onClick={() => setSelectedSummary(summary)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          {summary.chapterTitle && (
                            <h3 className="text-lg font-semibold">{summary.chapterTitle}</h3>
                          )}
                          {summary.chapterNumber && (
                            <p className="text-sm text-gray-400">Chapter {summary.chapterNumber}</p>
                          )}
                          {summary.pageRange && (
                            <p className="text-sm text-gray-400">Pages: {summary.pageRange}</p>
                          )}
                        </div>
                      </div>
                      <div 
                        className="text-gray-300 line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: summary.content }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card text-center">
                  <p className="text-gray-400 mb-4">No summaries for this book yet</p>
                  <button
                    onClick={() => setShowAddSummary(true)}
                    className="btn-primary"
                  >
                    Add First Summary
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="card h-96 flex items-center justify-center">
              <p className="text-gray-400">Select a book to view summaries</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Book Modal */}
      {showAddBook && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-dark rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add New Book</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Book Title *"
                value={newBook.bookTitle}
                onChange={(e) => setNewBook({ ...newBook, bookTitle: e.target.value })}
                className="input w-full"
              />
              <input
                type="text"
                placeholder="Author"
                value={newBook.author}
                onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                className="input w-full"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Current Page"
                  value={newBook.currentPage || ''}
                  onChange={(e) => setNewBook({ ...newBook, currentPage: parseInt(e.target.value) || 0 })}
                  className="input w-full"
                />
                <input
                  type="number"
                  placeholder="Total Pages"
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
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowAddBook(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBook}
                disabled={!newBook.bookTitle}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Book
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Summary Modal */}
      {showAddSummary && selectedBook && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-dark rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Add Summary for "{selectedBook.bookTitle}"</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Chapter Title"
                  value={newSummary.chapterTitle}
                  onChange={(e) => setNewSummary({ ...newSummary, chapterTitle: e.target.value })}
                  className="input w-full"
                />
                <input
                  type="number"
                  placeholder="Chapter Number"
                  value={newSummary.chapterNumber}
                  onChange={(e) => setNewSummary({ ...newSummary, chapterNumber: e.target.value })}
                  className="input w-full"
                />
              </div>
              <input
                type="text"
                placeholder="Page Range (e.g., 20-45)"
                value={newSummary.pageRange}
                onChange={(e) => setNewSummary({ ...newSummary, pageRange: e.target.value })}
                className="input w-full"
              />
              <div>
                <label className="block text-sm text-gray-400 mb-2">Summary Content *</label>
                <RichTextEditor
                  content={newSummary.content}
                  onChange={(content) => setNewSummary({ ...newSummary, content })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowAddSummary(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSummary}
                disabled={!newSummary.content}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryPage;