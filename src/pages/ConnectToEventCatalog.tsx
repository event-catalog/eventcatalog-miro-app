import React, { useState, ChangeEvent } from 'react';
import { useNavigate } from 'react-router';
import { setCatalogData } from '../stores/catalogStore';

const ConnectToEventCatalog = () => {
  const [jsonText, setJsonText] = useState<string>('');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError('');

    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string);
          setCatalogData(jsonData);
          navigate('/');
        } catch (error) {
          console.error('Error parsing JSON file:', error);
          setError('Invalid JSON file. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-purple-50 to-white overflow-y-auto">
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-3"
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span>Back</span>
        </button>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center shadow-sm">
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">EventCatalog</h1>
            <p className="text-xs text-gray-500">Model with your architecture</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          Bring your existing architecture artifacts from{' '}
          <a
            href="https://eventcatalog.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 hover:underline"
          >
            EventCatalog
          </a>{' '}
          into Miro.
        </p>
      </div>

      {/* Main Content */}
      <div className="px-5 flex-1 space-y-4 mt-4">
        {/* How it works */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">How it works</h2>
          <ol className="space-y-2.5">
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                1
              </span>
              <div>
                <p className="text-sm text-gray-700 font-medium">Export your catalog</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Run <code className="text-purple-600 bg-purple-50 px-1 py-0.5 rounded">npm run export</code> in your project
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                2
              </span>
              <div>
                <p className="text-sm text-gray-700 font-medium">Import into Miro</p>
                <p className="text-xs text-gray-400 mt-0.5">Upload the JSON file or paste the output below</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                3
              </span>
              <div>
                <p className="text-sm text-gray-700 font-medium">Model your future state</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Drag your real services, events and commands onto the board to design what comes next
                </p>
              </div>
            </li>
          </ol>
        </div>

        {/* Upload File */}
        <div>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center bg-white hover:border-purple-300 hover:bg-purple-50/30 transition-all duration-200 cursor-pointer group">
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" id="fileInput" />
            <label htmlFor="fileInput" className="cursor-pointer">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
                <svg
                  className="w-5 h-5 text-purple-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">Upload catalog JSON</p>
              <p className="text-xs text-gray-400">Drop your exported file here</p>
            </label>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <svg
              className="w-4 h-4 text-red-500 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px bg-gray-200 flex-1"></div>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">or</span>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        {/* Paste JSON */}
        <div>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="Paste your catalog JSON here..."
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-300 text-xs font-mono h-28 resize-y bg-white transition-all duration-200"
          />
          <button
            type="button"
            onClick={() => {
              setError('');
              try {
                const jsonData = JSON.parse(jsonText);
                setCatalogData(jsonData);
                navigate('/');
              } catch (e) {
                setError('Invalid JSON. Please check the format and try again.');
              }
            }}
            disabled={!jsonText.trim()}
            className="w-full mt-2 bg-purple-600 text-white py-2.5 px-4 rounded-xl hover:bg-purple-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm shadow-sm hover:shadow"
          >
            Import
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-5 mt-2">
        <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
          <a
            href="https://www.eventcatalog.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-purple-600 transition-colors"
          >
            eventcatalog.dev
          </a>
          <a
            href="https://discord.com/invite/3rjaZMmrAm"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#5865F2] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            Community
          </a>
        </div>
      </div>
    </div>
  );
};

export default ConnectToEventCatalog;
