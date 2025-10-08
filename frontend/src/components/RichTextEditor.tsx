import React, { useRef } from 'react';
import { sanitizeHTML } from '../utils/sanitizeHTML';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  
  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(sanitizeHTML(editorRef.current.innerHTML));
    }
  };
  
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };
  
  return (
    <div className="border border-gray-light rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-medium p-2 flex flex-wrap gap-1 border-b border-gray-light">
        <button
          type="button"
          onClick={() => executeCommand('bold')}
          className="p-2 hover:bg-gray-light rounded transition-colors"
          title="Bold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
          </svg>
        </button>
        
        <button
          type="button"
          onClick={() => executeCommand('italic')}
          className="p-2 hover:bg-gray-light rounded transition-colors"
          title="Italic"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4h4M14 4l-4 16m-4 0h4" />
          </svg>
        </button>
        
        <button
          type="button"
          onClick={() => executeCommand('underline')}
          className="p-2 hover:bg-gray-light rounded transition-colors"
          title="Underline"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v8a5 5 0 0010 0V4M5 20h14" />
          </svg>
        </button>
        
        <div className="w-px bg-gray-light mx-1" />
        
        <button
          type="button"
          onClick={() => executeCommand('insertUnorderedList')}
          className="p-2 hover:bg-gray-light rounded transition-colors"
          title="Bullet List"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 0m-7 6h7m-7 6h7M5 5h.01M5 11h.01M5 17h.01" />
          </svg>
        </button>
        
        <button
          type="button"
          onClick={() => executeCommand('insertOrderedList')}
          className="p-2 hover:bg-gray-light rounded transition-colors"
          title="Numbered List"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5h7M9 11h7M9 17h7M5.5 5v1.5M6 8.5H5a.5.5 0 01-.5-.5v-1M4.5 11.5H6v3H4.5M6 17v1a.5.5 0 01-.5.5H5" />
          </svg>
        </button>
        
        <div className="w-px bg-gray-light mx-1" />
        
        <button
          type="button"
          onClick={() => executeCommand('formatBlock', '<h2>')}
          className="p-2 hover:bg-gray-light rounded transition-colors"
          title="Heading"
        >
          <span className="text-sm font-bold">H</span>
        </button>
        
        <button
          type="button"
          onClick={() => executeCommand('formatBlock', '<blockquote>')}
          className="p-2 hover:bg-gray-light rounded transition-colors"
          title="Quote"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        
        <div className="w-px bg-gray-light mx-1" />
        
        <button
          type="button"
          onClick={() => executeCommand('removeFormat')}
          className="p-2 hover:bg-gray-light rounded transition-colors"
          title="Clear Formatting"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
          </svg>
        </button>
      </div>
      
      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="p-4 min-h-[200px] max-h-[400px] overflow-y-auto bg-gray-dark text-white focus:outline-none"
        dangerouslySetInnerHTML={{ __html: sanitizeHTML(content) }}
        onInput={(e) => onChange(sanitizeHTML((e.target as HTMLDivElement).innerHTML))}
        onPaste={handlePaste}
        style={{
          lineHeight: '1.6',
        }}
      />
    </div>
  );
};

export default RichTextEditor;