import * as React from 'react';

const Footer: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3">
      <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
        <span>Need help?</span>
        <a
          href="https://discord.com/invite/3rjaZMmrAm"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Contact us on Discord
        </a>
      </div>
    </div>
  );
};

export default Footer;
