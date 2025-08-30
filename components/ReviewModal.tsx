import React, { useState, useEffect, useMemo } from 'react';
import { StudentMark } from '../types';
import { DataTable } from './DataTable';
import { CloseIcon } from './Icons';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reviewedMarks: StudentMark[]) => void;
  marks: StudentMark[];
  maxMark: number;
  existingMarks: StudentMark[];
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, onConfirm, marks, maxMark, existingMarks }) => {
  const [reviewedMarks, setReviewedMarks] = useState<StudentMark[]>([]);
  
  useEffect(() => {
    // When the modal opens with new marks, update the state
    if (marks.length > 0) {
        setReviewedMarks(marks);
    }
  }, [marks, isOpen]);

  const { newUniqueMarks, duplicateCount } = useMemo(() => {
    const existingStudentIds = new Set(existingMarks.map(m => m.studentId));
    const newUniqueMarks = reviewedMarks.filter(m => !existingStudentIds.has(m.studentId));
    const duplicateCount = reviewedMarks.length - newUniqueMarks.length;
    return { newUniqueMarks, duplicateCount };
  }, [reviewedMarks, existingMarks]);


  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(newUniqueMarks);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Review Extracted Data</h2>
          <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {reviewedMarks.length > 0 ? (
            <DataTable marks={reviewedMarks} setMarks={setReviewedMarks} maxMark={maxMark} />
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-10">No data to review.</p>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
           {duplicateCount > 0 && (
             <p className="text-sm text-center text-yellow-600 dark:text-yellow-400 mb-4">
                {duplicateCount} {duplicateCount === 1 ? 'entry' : 'entries'} with duplicate Student IDs were found and will be ignored.
             </p>
           )}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button 
                onClick={onClose} 
                className="w-full sm:w-auto px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 font-semibold"
            >
              Discard All
            </button>
            <button 
                onClick={handleConfirm}
                disabled={newUniqueMarks.length === 0}
                className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold disabled:bg-indigo-300 disabled:cursor-not-allowed"
            >
              Add {newUniqueMarks.length} New {newUniqueMarks.length === 1 ? 'Entry' : 'Entries'} to Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
