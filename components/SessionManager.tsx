import React, { useState } from 'react';
import { Session } from '../types';
import { PlusIcon, TrashIcon } from './Icons';

interface SessionManagerProps {
  sessions: Session[];
  onCreateSession: (name: string, maxMark: number) => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}

export const SessionManager: React.FC<SessionManagerProps> = ({ sessions, onCreateSession, onSelectSession, onDeleteSession }) => {
  const [sessionName, setSessionName] = useState('');
  const [maxMark, setMaxMark] = useState<number | ''>(100);
  const [error, setError] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionName.trim()) {
      setError('Session name cannot be empty.');
      return;
    }
    if (maxMark === '' || maxMark <= 0) {
      setError('Maximum mark must be a positive number.');
      return;
    }
    setError('');
    onCreateSession(sessionName.trim(), maxMark);
    setSessionName('');
    setMaxMark(100);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation(); // Prevent onSelectSession from firing
      if(window.confirm('Are you sure you want to delete this session and all its records? This cannot be undone.')) {
        onDeleteSession(id);
      }
  }

  const sortedSessions = [...sessions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4 py-8">
      <div className="w-full max-w-3xl">
        <div className="p-8 space-y-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Session Management</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Create a new session or select an existing one to continue.</p>
          </div>

          {/* Create New Session Form */}
          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create New Session</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="sm:col-span-2">
                <label htmlFor="session-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Session Name</label>
                <input
                  id="session-name"
                  type="text"
                  value={sessionName}
                  onChange={e => setSessionName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Midterm Exam - CS101"
                />
              </div>
              <div>
                <label htmlFor="max-mark" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Max Mark</label>
                <input
                  id="max-mark"
                  type="number"
                  value={maxMark}
                  onChange={e => setMaxMark(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  min="1"
                />
              </div>
              <button type="submit" className="w-full sm:col-span-3 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center justify-center space-x-2 transition-colors">
                <PlusIcon className="w-5 h-5" />
                <span>Create & Start Session</span>
              </button>
            </form>
            {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
          </div>

          {/* Existing Sessions List */}
          {sortedSessions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-white">Or Select an Existing Session</h2>
              <ul className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {sortedSessions.map(session => (
                  <li key={session.id} onClick={() => onSelectSession(session.id)} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/50 flex justify-between items-center transition-colors">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-100">{session.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {session.marks.length} records • Created {new Date(session.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button onClick={(e) => handleDelete(e, session.id)} aria-label={`Delete session ${session.name}`} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                      <TrashIcon className="w-5 h-5"/>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
          by Dickson M Chaula
        </p>
      </div>
    </div>
  );
};