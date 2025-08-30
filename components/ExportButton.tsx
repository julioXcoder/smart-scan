import React, { useState, useRef, useEffect } from 'react';
import { ExportIcon, ChevronDownIcon } from './Icons';

interface ExportButtonProps {
    onExport: (format: 'csv' | 'xlsx') => void;
    canExport: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ onExport, canExport }) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleExportClick = (format: 'csv' | 'xlsx') => {
      onExport(format);
      setIsExportMenuOpen(false);
  }

  return (
    <div className="relative" ref={exportMenuRef}>
        <button
        onClick={() => setIsExportMenuOpen(prev => !prev)}
        disabled={!canExport}
        className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-300 dark:disabled:bg-green-800 disabled:cursor-not-allowed transition-colors text-lg"
        >
        <ExportIcon className="w-6 h-6" />
        <span>Export Data</span>
        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {isExportMenuOpen && canExport && (
        <div className="absolute bottom-full mb-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg z-20 border border-gray-200 dark:border-gray-700">
            <ul className="py-1">
            <li>
                <button
                onClick={() => handleExportClick('xlsx')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                Export to Excel (.xlsx)
                </button>
            </li>
            <li>
                <button
                onClick={() => handleExportClick('csv')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                Export to CSV
                </button>
            </li>
            </ul>
        </div>
        )}
    </div>
  );
};