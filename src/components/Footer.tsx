import * as React from 'react';

const Footer: React.FC = () => {
  return (
    <div className="shrink-0 bg-white border-t border-gray-200 p-3">
      <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
        <span>Need help?</span>
        <a
          href="https://eventcatalog.dev/discord"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Contact us on Discord
        </a>
        <span>·</span>
        <a
          href="https://github.com/event-catalog/eventcatalog-miro-app/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Raise an issue
        </a>
      </div>
    </div>
  );
};

export default Footer;
