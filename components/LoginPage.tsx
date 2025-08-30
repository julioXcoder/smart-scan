import React, { useState } from 'react';
import { LockIcon } from './Icons';

interface LoginPageProps {
  onLogin: () => void;
  error?: string | null;
  setError: (error: string | null) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, error, setError }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPassword = localStorage.getItem('smartscan-password') || 'teacher';
    if (password === storedPassword) {
      setError(null);
      onLogin();
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50">
              <LockIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              SmartScan Login
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Please enter the password to access the application.
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm">
              <div>
                <label htmlFor="password-input" className="sr-only">
                  Password
                </label>
                <input
                  id="password-input"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>
            
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Login
              </button>
            </div>
          </form>
        </div>
         <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
          by Dickson M Chaula
        </p>
      </div>
    </div>
  );
};