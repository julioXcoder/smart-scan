import React from 'react';
import { LogoIcon, BackIcon } from './Icons';

interface HeaderProps {
    sessionName: string | null;
    onSwitchSession: () => void;
}

export const Header: React.FC<HeaderProps> = ({ sessionName, onSwitchSession }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-gray-200 dark:border-gray-700 mb-8">
      <div className='w-full sm:w-auto flex-grow'>
        <div className="flex items-center space-x-3">
            <LogoIcon className="h-10 w-10 text-indigo-600"/>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              SmartScan Marks
            </h1>
        </div>
        {sessionName && (
           <div className="flex items-center space-x-2 mt-2">
             <button onClick={onSwitchSession} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1">
                <BackIcon className="w-4 h-4" />
                <span>Switch Session</span>
             </button>
             <p className="text-sm text-gray-500 dark:text-gray-400 font-medium truncate">/ {sessionName}</p>
          </div>
        )}
      </div>
    </div>
  );
};