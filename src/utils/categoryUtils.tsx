import React from 'react';
import {
  ServerIcon,
  BoltIcon,
  ChatBubbleLeftIcon,
  MagnifyingGlassIcon,
  ArrowsRightLeftIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline';
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
    case 'containers':
      return <CircleStackIcon className="w-[18px] h-[18px]" />;
    default:
      return <ServerIcon className="w-[18px] h-[18px]" />;
  }
};

export const getCategoryStyles = (category: string): StyleResult => {
  switch (category) {
    case 'services':
      return {
        backgroundColor: '#FFE2E8',
        borderColor: '#D1D5DB',
        iconColor: '#EC4899',
        fillColor: 'pink',
      };
    case 'events':
      return {
        backgroundColor: '#FFE5CC',
        borderColor: '#F97316',
        iconColor: '#F97316',
        fillColor: 'yellow',
      };
    case 'commands':
      return {
        backgroundColor: '#D9E8FF',
        borderColor: '#3B82F6',
        iconColor: '#3B82F6',
        fillColor: 'blue',
      };
    case 'queries':
      return {
        backgroundColor: '#D1FAE5',
        borderColor: '#22C55E',
        iconColor: '#22C55E',
        fillColor: 'green',
      };
    case 'channels':
      return {
        backgroundColor: '#F3F4F6',
        borderColor: '#9CA3AF',
        iconColor: '#9CA3AF',
        fillColor: 'gray',
      };
    case 'containers':
      return {
        backgroundColor: '#EDE9FE',
        borderColor: '#8B5CF6',
        iconColor: '#8B5CF6',
        fillColor: 'violet',
      };
    default:
      return {
        backgroundColor: '#F3F4F6',
        borderColor: '#9CA3AF',
        iconColor: '#9CA3AF',
        fillColor: 'gray',
      };
  }
};
