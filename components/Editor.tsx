import React from 'react';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  isDarkMode: boolean;
}

const Editor: React.FC<EditorProps> = ({ value, onChange, error, isDarkMode }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 relative">
        <textarea
          className={`w-full h-full font-mono text-sm p-4 outline-none resize-none border rounded-lg transition-colors leading-relaxed duration-300 
            ${isDarkMode 
              ? 'bg-slate-900 text-slate-300 border-slate-800 focus:border-indigo-500' 
              : 'bg-white text-slate-800 border-slate-300 focus:border-indigo-500'}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          placeholder="Enter your YAML dialogue tree here..."
        />
      </div>
      {error && (
        <div className={`mt-2 p-3 border text-xs rounded animate-pulse ${isDarkMode ? 'bg-red-900/50 border-red-800 text-red-200' : 'bg-red-50 border-red-200 text-red-600'}`}>
          <strong>Syntax Error:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default Editor;