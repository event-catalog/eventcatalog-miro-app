import React, { useState, ChangeEvent } from 'react';
import { useEventCatalog } from '../hooks/EventCatalogContext';
import { useNavigate } from 'react-router';

const ConnectToEventCatalog = () => {
  const [catalogUrl, setCatalogUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const { setCatalogData } = useEventCatalog();
  const navigate = useNavigate();

  const sanitizeUrl = (inputUrl: string): string | null => {
    try {
      // Remove trailing slashes and /api/catalog if present
      let cleanUrl = inputUrl
        .replace(/\/+$/, '') // Remove trailing slashes
        .replace(/\/api\/catalog\/?$/, ''); // Remove /api/catalog and its potential trailing slash

      // Validate URL
      const url = new URL(cleanUrl);

      // Ensure we don't have double slashes when constructing the final URL
      return url.href.replace(/\/$/, '');
    } catch (error) {
      return null;
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const sanitizedUrl = sanitizeUrl(catalogUrl);
    if (!sanitizedUrl) {
      setError('Please enter a valid URL');
      return;
    }

    try {
      const apiUrl = `${sanitizedUrl}/api/catalog`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch catalog: ${response.statusText}`);
      }

      const data = await response.json();
      setCatalogData(data);
      console.log('EventCatalog data from URL:', data);
      navigate('/resource-list');
    } catch (error) {
      console.error('Error fetching EventCatalog data:', error);
      setError('Failed to connect to EventCatalog. Please check the URL and try again.');
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError('');

    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string);
          setCatalogData(jsonData);
          console.log('EventCatalog data from file:', jsonData);
          navigate('/resource-list');
        } catch (error) {
          console.error('Error parsing JSON file:', error);
          setError('Invalid JSON file. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="p-4 max-w-full bg-white min-h-screen">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Import EventCatalog Resources</h1>
        <p className="text-sm text-gray-600">
          Use EventCatalog resources in your Miro board to start visualizing your architecture.
        </p>
      </div>

      <div className="space-y-4">
        {/* URL Input Section */}
        <div className="bg-purple-50 rounded-lg p-4">
          <h2 className="text-base font-semibold text-purple-900 mb-3">Connect via URL</h2>
          <span className="text-sm text-gray-500">
            Enter the URL of your EventCatalog instance. If your catalog instance is not public, you can upload a JSON file
            instead.
          </span>
          <form onSubmit={handleUrlSubmit} className="space-y-3 mt-2">
            <div>
              <label htmlFor="catalogUrl" className="block text-sm font-medium text-purple-700 mb-1 hidden">
                EventCatalog URL
              </label>
              <input
                type="url"
                id="catalogUrl"
                placeholder="https://demo.eventcatalog.dev"
                value={catalogUrl}
                onChange={(e) => setCatalogUrl(e.target.value)}
                className="w-full p-2 border border-purple-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-400 text-sm"
              />
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors duration-200 font-medium text-sm"
            >
              Connect
            </button>
          </form>
        </div>

        <div className="flex items-center justify-center space-x-4">
          <div className="h-px bg-gray-200 flex-1"></div>
          <span className="text-sm text-gray-500">or</span>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        {/* File Upload Section */}
        <div className="bg-purple-50 rounded-lg p-4">
          <h2 className="text-base font-semibold text-purple-900 mb-3">Upload JSON File</h2>
          <span className="text-sm text-gray-500 ">
            Enabled the Catalog API in your catalog, and then navigate to <code className="text-purple-700">/api/catalog</code> to
            get the catalog JSON dump.
          </span>
          <div className="border-2 border-dashed border-purple-200 rounded-md p-4 text-center bg-white mt-2">
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" id="fileInput" />
            <label
              htmlFor="fileInput"
              className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors duration-200 text-sm font-medium"
            >
              Choose File
            </label>
            <p className="mt-2 text-xs text-gray-500">Upload your EventCatalog JSON export</p>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-4">Join our community for support and discussions</p>
            <a
              href="https://discord.com/invite/3rjaZMmrAm"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 bg-[#5865F2] text-white rounded-md hover:bg-[#4752C4] transition-colors duration-200 text-sm font-medium space-x-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span>Join Discord Community</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectToEventCatalog;
