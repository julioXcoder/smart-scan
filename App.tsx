import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { LoginPage } from './components/LoginPage';
import { ImageUploader } from './components/ImageUploader';
import { DataTable } from './components/DataTable';
import { Spinner } from './components/Spinner';
import { extractMarksFromImage as extractWithGemini } from './services/geminiService';
import { extractMarksFromImageWithMLKit } from './services/mlKitService';
import { Session, StudentMark } from './types';
import { Header } from './components/Header';
import { RealtimeScanner } from './components/RealtimeScanner';
import { SessionManager } from './components/SessionManager';
import { ReviewModal } from './components/ReviewModal';
import { SettingsPage } from './components/SettingsPage';
import * as XLSX from 'xlsx';
import { SettingsIcon, CloseIcon } from './components/Icons';
import { ExportButton } from './components/ExportButton';

export type OcrEngine = 'gemini' | 'ml_kit';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  const [files, setFiles] = useState<File[]>([]);
  const [pendingReviewMarks, setPendingReviewMarks] = useState<StudentMark[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'file' | 'camera'>('file');

  const [theme, setTheme] = useState(() => localStorage.getItem('smartscan-theme') || 'system');
  const [ocrEngine, setOcrEngine] = useState<OcrEngine>(() => (localStorage.getItem('smartscan-ocr-engine') as OcrEngine) || 'gemini');

  // Theme management
  useEffect(() => {
    const applyTheme = (t: string) => {
        const root = window.document.documentElement;
        if (t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    };

    applyTheme(theme);
    localStorage.setItem('smartscan-theme', theme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
        if (theme === 'system') {
            applyTheme('system');
        }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);
  
  // OCR Engine setting persistence
  useEffect(() => {
    localStorage.setItem('smartscan-ocr-engine', ocrEngine);
  }, [ocrEngine]);

  // Load sessions and auth from storage on initial render
  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem('smartscan-sessions');
      if (savedSessions) {
        setSessions(JSON.parse(savedSessions));
      }
      const savedAuth = sessionStorage.getItem('smartscan-authenticated');
      if (savedAuth === 'true') {
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.error("Failed to load data from storage", e);
      localStorage.removeItem('smartscan-sessions');
      sessionStorage.removeItem('smartscan-authenticated');
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('smartscan-sessions', JSON.stringify(sessions));
    } catch (e) {
      console.error("Failed to save sessions to localStorage", e);
    }
  }, [sessions]);
  
  const handleLogin = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('smartscan-authenticated', 'true');
    // Set default password if none exists
    if (!localStorage.getItem('smartscan-password')) {
        localStorage.setItem('smartscan-password', 'teacher');
    }
    setError(null);
  };
  
  const handleLogout = () => {
    sessionStorage.removeItem('smartscan-authenticated');
    setIsAuthenticated(false);
    setActiveSessionId(null);
    setIsSettingsOpen(false);
  };

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to delete ALL sessions and reset your password? This cannot be undone.')) {
        localStorage.clear();
        sessionStorage.clear();
        handleLogout();
        window.location.reload();
    }
  };


  const activeSession = useMemo(() => sessions.find(s => s.id === activeSessionId), [sessions, activeSessionId]);
  
  const handleCreateSession = (name: string, maxMark: number) => {
    const newSession: Session = {
      id: crypto.randomUUID(),
      name,
      maxMark,
      marks: [],
      createdAt: new Date().toISOString(),
    };
    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(newSession.id);
  };

  const handleDeleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) {
        setActiveSessionId(null);
    }
  };

  const handleUpdateSessionMarks = (updatedMarks: StudentMark[]) => {
    if (!activeSessionId) return;
    setSessions(prev => prev.map(s => s.id === activeSessionId ? {...s, marks: updatedMarks} : s));
  };
  
  const handleConfirmReview = (reviewedMarks: StudentMark[]) => {
      if (!activeSession) return;
      const existingStudentIds = new Set(activeSession.marks.map(m => m.studentId));
      const newUniqueMarks = reviewedMarks.filter(m => !existingStudentIds.has(m.studentId));
      
      handleUpdateSessionMarks([...activeSession.marks, ...newUniqueMarks]);
      setIsReviewModalOpen(false);
      setPendingReviewMarks([]);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const processImages = async (base64Images: {data: string, mimeType: string}[]) => {
      if (!activeSession) {
          setError('No active session. Please create or select a session first.');
          return;
      }
      setIsLoading(true);
      setError(null);

      try {
        const extractFn = ocrEngine === 'gemini' ? extractWithGemini : extractMarksFromImageWithMLKit;
        const processingPromises = base64Images.map(img => 
          extractFn(img.data, img.mimeType, activeSession.maxMark)
        );
        const results = await Promise.all(processingPromises);
        const allMarks = results.flat().map(mark => ({ ...mark, id: crypto.randomUUID() }));
        
        if(allMarks.length > 0) {
            setPendingReviewMarks(allMarks);
            setIsReviewModalOpen(true);
        } else {
            setError("No marks were found in the provided images.");
            setTimeout(() => setError(null), 3000);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to process images. Check network connection or API configuration.');
      } finally {
        setIsLoading(false);
      }
  };

  const handleProcessFiles = useCallback(async () => {
    if (files.length === 0) return;
    const imagePayloads = await Promise.all(
        files.map(async file => ({
            data: await fileToBase64(file),
            mimeType: file.type
        }))
    );
    await processImages(imagePayloads);
    setFiles([]);
  }, [files, activeSession, ocrEngine]);
  
  const handleProcessCameraImages = useCallback(async (base64DataUrls: string[]) => {
     if (base64DataUrls.length === 0) return;
     const imagePayloads = base64DataUrls.map(url => ({
         data: url.split(',')[1],
         mimeType: url.substring(url.indexOf(':') + 1, url.indexOf(';'))
     }));
     await processImages(imagePayloads);
  }, [activeSession, ocrEngine]);

  const handleExport = (format: 'csv' | 'xlsx') => {
    if (!activeSession || activeSession.marks.length === 0) {
      setError('No data in the current session to export.');
      return;
    }
    const headers = ['Student ID', 'Mark'];
    const data = activeSession.marks.map(m => [m.studentId, m.mark ?? '']);
    if (format === 'csv') {
        const csvContent = [headers.join(','), ...data.map(row => row.join(','))].join('\n');
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
        link.download = `${activeSession.name.replace(/ /g, '_')}_marks.csv`;
        link.click();
    } else {
        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Student Marks');
        XLSX.writeFile(wb, `${activeSession.name.replace(/ /g, '_')}_marks.xlsx`);
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} error={error} setError={setError} />;
  }
  
  if (isSettingsOpen) {
      return <SettingsPage 
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        ocrEngine={ocrEngine}
        setOcrEngine={setOcrEngine}
        onLogout={handleLogout}
        onClearAllData={handleClearAllData}
      />
  }
  
  const renderContent = () => {
      if (!activeSessionId || !activeSession) {
          return <SessionManager 
            sessions={sessions} 
            onCreateSession={handleCreateSession} 
            onSelectSession={setActiveSessionId}
            onDeleteSession={handleDeleteSession}
          />
      }

      const studentMarks = activeSession.marks;

      return (
        <>
        <ReviewModal
            isOpen={isReviewModalOpen}
            onClose={() => setIsReviewModalOpen(false)}
            onConfirm={handleConfirmReview}
            marks={pendingReviewMarks}
            maxMark={activeSession.maxMark}
            existingMarks={activeSession.marks}
        />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans flex flex-col">
          <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Header 
                sessionName={activeSession.name}
                onSwitchSession={() => setActiveSessionId(null)}
            />
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
                <span className="block sm:inline">{error}</span>
                <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                   <CloseIcon className="h-6 w-6 text-red-500" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">1. Input Method</h2>
                    <div className="flex rounded-lg bg-gray-200 dark:bg-gray-700 p-1 mb-4">
                        <button onClick={() => setScanMode('file')} className={`w-full py-2 rounded-md text-sm font-medium transition-colors ${scanMode === 'file' ? 'bg-white dark:bg-gray-800 shadow text-indigo-600' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-gray-600/50'}`}>Upload Files</button>
                        <button onClick={() => setScanMode('camera')} className={`w-full py-2 rounded-md text-sm font-medium transition-colors ${scanMode === 'camera' ? 'bg-white dark:bg-gray-800 shadow text-indigo-600' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-gray-600/50'}`}>Live Scan</button>
                    </div>
                    {scanMode === 'file' ? <ImageUploader files={files} setFiles={setFiles} /> : <RealtimeScanner onProcess={handleProcessCameraImages} isProcessing={isLoading} />}
                </div>

                {scanMode === 'file' && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">2. Process Images</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Click below to start OCR for uploaded images using the <span className="font-semibold">{ocrEngine === 'gemini' ? 'Gemini Engine' : 'ML Kit Engine'}</span>.</p>
                        <button onClick={handleProcessFiles} disabled={files.length === 0 || isLoading} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center justify-center transition-colors">
                            {isLoading && scanMode === 'file' ? <Spinner /> : 'Extract Data from Files'}
                        </button>
                    </div>
                )}
              </div>

              <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex flex-col">
                 <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex-shrink-0">{studentMarks.length > 0 ? `Records for ${activeSession.name}` : 'Results'}</h2>
                {isLoading && studentMarks.length === 0 ? (
                  <div className="flex-grow flex justify-center items-center"><div className="text-center"><Spinner size="lg"/><p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Analyzing mark sheets...</p></div></div>
                ) : studentMarks.length > 0 ? (
                  <div className="flex-grow flex flex-col space-y-6">
                    <div className="flex-grow">
                        <DataTable marks={studentMarks} setMarks={handleUpdateSessionMarks} maxMark={activeSession.maxMark} />
                    </div>
                    <div className="flex justify-center pt-4 border-t border-gray-200 dark:border-gray-700">
                        <ExportButton onExport={handleExport} canExport={studentMarks.length > 0} />
                    </div>
                  </div>
                ) : (
                  <div className="flex-grow flex justify-center items-center h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">Extracted data will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          </main>
          <footer className="w-full text-center py-4 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
            <p>by Dickson M Chaula</p>
          </footer>
        </div>
        </>
      );
  };

  return (
    <div className="relative">
      {isAuthenticated && <button
        onClick={() => setIsSettingsOpen(true)}
        className="fixed top-4 right-4 z-30 p-2 text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Open Settings"
      >
        <SettingsIcon className="w-6 h-6"/>
      </button>}
      {renderContent()}
    </div>
  );
};

export default App;
