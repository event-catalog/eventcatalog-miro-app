import React from 'react';
import { ServerIcon, BoltIcon, ChatBubbleLeftIcon, MagnifyingGlassIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { StyleResult } from './types';

export const getIconForCategory = (category: string): JSX.Element => {
  switch (category) {
    case 'services':
      return <ServerIcon className="w-[18px] h-[18px]" />;
    case 'events':
      return <BoltIcon className="w-[18px] h-[18px]" />;
    case 'commands':
      return <ChatBubbleLeftIcon className="w-[18px] h-[18px]" />;
    case 'queries':
      return <MagnifyingGlassIcon className="w-[18px] h-[18px]" />;
    case 'channels':
      return <ArrowsRightLeftIcon className="w-[18px] h-[18px]" />;
    default:
      return <ServerIcon className="w-[18px] h-[18px]" />;
  }
};

export const getCategoryStyles = (category: string): StyleResult => {
  switch (category) {
    case 'services':
      return {
        backgroundColor: '#FFE2E8',
        fillColor: 'pink',
      };
    case 'events':
      return {
        backgroundColor: '#FFE5CC',
        fillColor: 'yellow',
      };
    case 'commands':
      return {
        backgroundColor: '#D9E8FF',
        fillColor: 'blue',
      };
    case 'queries':
      return {
        backgroundColor: '#D1FAE5',
        fillColor: 'green',
      };
    case 'channels':
      return {
        backgroundColor: '#EDE9FE',
        fillColor: 'purple',
      };
    default:
      return {
        backgroundColor: '#F3F4F6',
        fillColor: 'gray',
      };
  }
};
