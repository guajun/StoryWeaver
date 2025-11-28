import React, { useState, useEffect } from 'react';
import yaml from 'js-yaml';
import { Upload, FileJson, RotateCcw, Moon, Sun, Settings2 } from 'lucide-react';
import Editor from './components/Editor';
import GraphViewer from './components/GraphViewer';
import { SAMPLE_YAML, SCHEMA_JSON } from './utils/sampleData';
import { DialogueNode } from './types';

const App: React.FC = () => {
  const [yamlContent, setYamlContent] = useState<string>(SAMPLE_YAML);
  const [parsedData, setParsedData] = useState<DialogueNode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [repulsion, setRepulsion] = useState(1500);

  // Parse YAML effect
  useEffect(() => {
    try {
      const parsed = yaml.load(yamlContent);
      
      if (!Array.isArray(parsed)) {
        throw new Error("Root must be a YAML list (array) of nodes.");
      }

      // Basic validation
      parsed.forEach((node: any, index: number) => {
        if (!node.id) throw new Error(`Node at index ${index} is missing 'id'`);
        if (!node.text) throw new Error(`Node '${node.id}' is missing 'text'`);
      });

      setParsedData(parsed as DialogueNode[]);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Invalid YAML format");
    }
  }, [yamlContent]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setYamlContent(content);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleDownloadSchema = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(SCHEMA_JSON, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "dialogue_schema.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleLoadSample = () => {
      setYamlContent(SAMPLE_YAML);
  };

  return (
    <div className={`flex flex-col h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      {/* Header */}
      <header className={`h-16 border-b flex items-center justify-between px-6 backdrop-blur-sm transition-colors duration-300 ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white/50'}`}>
        <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
            </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">StoryWeaver</h1>
        </div>

        <div className="flex items-center space-x-3">
            <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-yellow-300' : 'text-slate-500 hover:bg-slate-200 hover:text-orange-500'}`}
                title="Toggle Theme"
            >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className={`h-6 w-px mx-2 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-300'}`}></div>
            <button 
                onClick={handleLoadSample}
                className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
            >
                <RotateCcw size={16} />
                <span>Reset Sample</span>
            </button>
            <button 
                onClick={handleDownloadSchema}
                className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded border border-transparent transition-colors ${isDarkMode ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 hover:border-emerald-800' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200'}`}
                title="Download JSON Schema for validation"
            >
                <FileJson size={16} />
                <span>Schema</span>
            </button>
            <label className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded cursor-pointer border border-transparent transition-colors ${isDarkMode ? 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/30 hover:border-indigo-800' : 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200'}`}>
                <Upload size={16} />
                <span>Upload YAML</span>
                <input type="file" accept=".yaml,.yml,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Editor Panel */}
        <div className="w-1/3 min-w-[350px] flex flex-col">
            <div className="flex items-center justify-between mb-2 px-1">
                <h2 className={`text-sm font-semibold uppercase tracking-wider flex items-center gap-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    YAML Editor
                </h2>
                <span className={`text-xs ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Auto-parsing</span>
            </div>
            <Editor 
                value={yamlContent} 
                onChange={setYamlContent} 
                error={error}
                isDarkMode={isDarkMode}
            />
        </div>

        {/* Visualizer Panel */}
        <div className="flex-1 flex flex-col min-w-0">
             <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-4">
                    <h2 className={`text-sm font-semibold uppercase tracking-wider flex items-center gap-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Node Graph
                    </h2>
                    
                    {/* Repulsion Controls */}
                    <div className="flex items-center gap-2 ml-4 group">
                        <Settings2 size={14} className={isDarkMode ? 'text-slate-600' : 'text-slate-400'} />
                        <label htmlFor="repulsion" className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Force:</label>
                        <input 
                            type="range" 
                            id="repulsion"
                            min="100" 
                            max="5000" 
                            step="100" 
                            value={repulsion}
                            onChange={(e) => setRepulsion(parseInt(e.target.value))}
                            className="w-24 h-1 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <span className={`text-xs w-8 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>{repulsion}</span>
                    </div>
                </div>

                <div className={`flex gap-2 text-xs ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    <span>Nodes: {parsedData.length}</span>
                </div>
            </div>
            <GraphViewer 
                data={parsedData} 
                onError={setError} 
                isDarkMode={isDarkMode} 
                repulsionForce={repulsion}
            />
        </div>
      </main>
    </div>
  );
};

export default App;