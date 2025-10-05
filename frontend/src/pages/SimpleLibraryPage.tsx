import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Book {
  id: string;
  title: string;
  author: string;
}

const SimpleLibraryPage = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const response = await axios.get(`${API_BASE}/books`);
      setBooks(response.data);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
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
      alert('שגיאה בטעינת קבצים מ-Google Drive');
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    
    try {
      await axios.post(`${API_BASE}/google-drive/import-summary/${selectedFile.id}`, {
        bookTitle: '',
        bookAuthor: '',
        tags: []
      });
      
      alert('הייבוא הצליח!');
      setShowDrivePicker(false);
      loadBooks();
    } catch (error) {
      console.error('Error importing:', error);
      alert('שגיאה בייבוא הסיכום');
    }
  };

  const openDrivePicker = () => {
    setShowDrivePicker(true);
    loadDriveFiles();
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">הספרייה שלי</h1>
        
        <button
          onClick={openDrivePicker}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow"
        >
          ☁️ ייבא סיכומים מ-Google Drive
        </button>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {books.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-gray-400">עדיין אין ספרים בספרייה</p>
            <p className="text-gray-500 mt-2">התחל על ידי ייבוא סיכומים מ-Google Drive</p>
          </div>
        ) : (
          books.map(book => (
            <div key={book.id} className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-1">{book.title}</h3>
              <p className="text-gray-400 text-sm">{book.author}</p>
            </div>
          ))
        )}
      </div>

      {/* Drive Picker Modal */}
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
                      onClick={() => setSelectedFile(file)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedFile?.id === file.id 
                          ? 'bg-blue-100 border-2 border-blue-500' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">{new Date(file.modifiedTime).toLocaleDateString('he-IL')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowDrivePicker(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ביטול
              </button>
              <button
                onClick={handleImport}
                disabled={!selectedFile}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ייבא סיכום
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleLibraryPage;
