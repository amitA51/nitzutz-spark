import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { googleDriveAPI } from '../api/googleDrive';
import type { GoogleDriveFile } from '../api/googleDrive';
import { booksAPI } from '../api';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface GoogleDrivePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

export const GoogleDrivePicker: React.FC<GoogleDrivePickerProps> = ({ isOpen, onClose, onImportSuccess }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<GoogleDriveFile | null>(null);
  const [importForm, setImportForm] = useState({
    bookTitle: '',
    bookAuthor: '',
    tags: [] as string[],
  });
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [quickSummary, setQuickSummary] = useState('');
  const [quickSummaryLoading, setQuickSummaryLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkConnectionAndLoadFiles();
    }
  }, [isOpen]);

  const checkConnectionAndLoadFiles = async () => {
    try {
      setLoading(true);
      const status = await googleDriveAPI.getStatus();
      setIsConnected(status.connected);
      
      if (status.connected) {
        const response = await googleDriveAPI.getRecentFiles();
        setFiles(response.files.filter(f => 
          f.mimeType === 'application/vnd.google-apps.document' ||
          f.mimeType === 'application/pdf'
        ));
      }
    } catch (error) {
      console.error('Failed to check connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAskAI = async () => {
    if (!selectedFile || !aiQuestion.trim()) return;
    try {
      setAiLoading(true);
      setAiAnswer('');
      const res = await googleDriveAPI.askAboutFile(selectedFile.id, aiQuestion);
      setAiAnswer(res.answer || '');
    } catch (e) {
      setAiAnswer('לא ניתן לשאול את ה-AI כרגע. ודא שמפתח ה-AI מוגדר בהגדרות.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleQuickSummary = async () => {
    if (!selectedFile) return;
    try {
      setQuickSummaryLoading(true);
      setQuickSummary('');
      const res = await googleDriveAPI.analyzeFile(selectedFile.id, 'summary');
      setQuickSummary(res.analysis?.summary || '');
    } catch (e) {
      setQuickSummary('לא ניתן לסכם כרגע. ודא שמפתח ה-AI מוגדר בהגדרות.');
    } finally {
      setQuickSummaryLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const success = await googleDriveAPI.connectWithPopup();
      if (success) {
        checkConnectionAndLoadFiles();
      }
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    
    try {
      setImporting(selectedFile.id);
      
      // Import the summary
      await booksAPI.importFromGoogleDrive(selectedFile.id, {
        bookTitle: importForm.bookTitle,
        bookAuthor: importForm.bookAuthor,
        tags: importForm.tags,
      });

      // Close modal and refresh
      if (onImportSuccess) {
        onImportSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Failed to import:', error);
      alert('שגיאה בייבוא הסיכום');
    } finally {
      setImporting(null);
    }
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (size?: string) => {
    if (!size) return '';
    const bytes = parseInt(size);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / 1048576)} MB`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
            <h2 className="text-2xl font-bold mb-2">ייבוא סיכומים מ-Google Drive</h2>
            <p className="text-white/80">בחר מסמך סיכום לייבוא לספרייה שלך</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : !isConnected ? (
            <div className="p-20 text-center">
              <div className="mb-8">
                <svg className="w-24 h-24 mx-auto text-gray-400" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M7.71 3.5L1.15 15l6.56 6.5h8.58L22.85 15L16.29 3.5H7.71M9.29 6h5.42l4.5 7.5l-4.5 4.5H9.29l-4.5-4.5L9.29 6Z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-700">לא מחובר ל-Google Drive</h3>
              <p className="text-gray-600 mb-8">התחבר לחשבון Google שלך כדי לגשת לסיכומים</p>
              <button
                onClick={handleConnect}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                התחבר ל-Google Drive
              </button>
            </div>
          ) : (
            <div className="flex h-[calc(90vh-120px)]">
              {/* File List */}
              <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
                <div className="p-4 border-b border-gray-200">
                  <input
                    type="text"
                    placeholder="חיפוש סיכומים..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div className="divide-y divide-gray-200">
                  {filteredFiles.map(file => (
                    <motion.div
                      key={file.id}
                      whileHover={{ backgroundColor: '#f9fafb' }}
                      onClick={() => setSelectedFile(file)}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedFile?.id === file.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                            {file.name}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{formatFileSize(file.size)}</span>
                            <span>
                              {format(new Date(file.modifiedTime), 'dd MMM yyyy', { locale: he })}
                            </span>
                          </div>
                        </div>
                        {file.thumbnailLink && (
                          <img
                            src={file.thumbnailLink}
                            alt=""
                            className="w-16 h-20 object-cover rounded ml-3"
                          />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Import Form + AI Assist */}
              <div className="w-1/2 p-6 overflow-y-auto">
                {selectedFile ? (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">פרטי הייבוא</h3>
                    
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <p className="text-sm text-gray-600 mb-1">קובץ נבחר:</p>
                      <p className="font-semibold">{selectedFile.name}</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          שם הספר
                        </label>
                        <input
                          type="text"
                          value={importForm.bookTitle}
                          onChange={(e) => setImportForm({ ...importForm, bookTitle: e.target.value })}
                          placeholder="יוחלץ אוטומטית מהמסמך"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          מחבר
                        </label>
                        <input
                          type="text"
                          value={importForm.bookAuthor}
                          onChange={(e) => setImportForm({ ...importForm, bookAuthor: e.target.value })}
                          placeholder="אופציונלי"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          תגיות
                        </label>
                        <input
                          type="text"
                          placeholder="הזן תגית ולחץ Enter"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                              setImportForm({
                                ...importForm,
                                tags: [...importForm.tags, e.currentTarget.value.trim()],
                              });
                              e.currentTarget.value = '';
                            }
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                          {importForm.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                            >
                              {tag}
                              <button
                                onClick={() => setImportForm({
                                  ...importForm,
                                  tags: importForm.tags.filter((_, i) => i !== index),
                                })}
                                className="hover:bg-blue-200 rounded-full p-0.5"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                    {/* AI Assist for selected file */}
                    <div className="mt-6 p-4 rounded-lg border border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-800">עוזר AI למסמך</h4>
                        <div className="flex gap-2">
                          <button
                            onClick={handleQuickSummary}
                            className="px-3 py-1 rounded bg-gray-800 text-white text-sm"
                            disabled={quickSummaryLoading}
                          >
                            {quickSummaryLoading ? 'מסכם...' : 'סכם מהר'}
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2 mb-2">
                        <input
                          value={aiQuestion}
                          onChange={(e) => setAiQuestion(e.target.value)}
                          placeholder="שאל שאלה על המסמך לפני ייבוא..."
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm"
                        />
                        <button
                          onClick={handleAskAI}
                          disabled={aiLoading || !aiQuestion.trim()}
                          className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50"
                        >
                          {aiLoading ? 'שולח...' : 'שאל'}
                        </button>
                      </div>
                      {(aiAnswer || quickSummary) && (
                        <div className="bg-white rounded-lg p-3 border border-gray-200 max-h-40 overflow-auto">
                          {quickSummary && (
                            <div className="mb-2">
                              <div className="text-xs text-gray-500 mb-1">סיכום מהיר:</div>
                              <div className="text-gray-800 whitespace-pre-wrap text-sm">{quickSummary}</div>
                            </div>
                          )}
                          {aiAnswer && (
                            <div>
                              <div className="text-xs text-gray-500 mb-1">תשובת AI:</div>
                              <div className="text-gray-800 whitespace-pre-wrap text-sm">{aiAnswer}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Close space-y-4 container */}
                    </div>

                    <div className="mt-6 flex gap-3 justify-end">
                      <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        ביטול
                      </button>
                      <button
                        onClick={handleImport}
                        disabled={importing !== null}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50"
                      >
                        {importing === selectedFile.id ? (
                          <span className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            מייבא...
                          </span>
                        ) : (
                          'ייבוא סיכום'
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 mt-20">
                    <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M9 2V8H15V2H20C20.5 2 21 2.5 21 3V21C21 21.5 20.5 22 20 22H4C3.5 22 3 21.5 3 21V3C3 2.5 3.5 2 4 2H9M12 10.5L7.5 15H10.5V19H13.5V15H16.5L12 10.5Z"/>
                    </svg>
                    <p>בחר מסמך מהרשימה לייבוא</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};