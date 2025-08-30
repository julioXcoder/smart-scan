
import React, { useState } from 'react';
import { StudentMark } from '../types';
import { TrashIcon, PenIcon, CheckIcon, CloseIcon } from './Icons';

interface DataTableProps {
  marks: StudentMark[];
  setMarks: (updatedMarks: StudentMark[]) => void;
  maxMark: number;
}

export const DataTable: React.FC<DataTableProps> = ({ marks, setMarks, maxMark }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedMark, setEditedMark] = useState<StudentMark | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const startEditing = (mark: StudentMark) => {
    setEditingId(mark.id);
    setEditedMark({ ...mark });
    setValidationError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditedMark(null);
  };

  const handleSave = () => {
    if (!editedMark || validationError) return;

    const updatedMarks = marks.map(mark =>
      mark.id === editingId ? editedMark : mark
    );
    setMarks(updatedMarks);
    cancelEditing();
  };

  const handleDelete = (id: string) => {
    setMarks(marks.filter(mark => mark.id !== id));
  };

  const handleInputChange = (field: 'studentId' | 'mark', value: string) => {
    if (!editedMark) return;

    if (field === 'studentId') {
      setEditedMark({ ...editedMark, studentId: value });
      return;
    }
    
    // Mark field
    setValidationError(null);
    if (value === '') {
      setEditedMark({ ...editedMark, mark: null });
    } else {
      const num = Number(value);
      setEditedMark({ ...editedMark, mark: num }); // This will be NaN if invalid input
      if (isNaN(num)) {
        setValidationError("Must be a valid number.");
      } else if (num < 0) {
        setValidationError("Cannot be negative.");
      } else if (num > maxMark) {
        setValidationError(`Max mark is ${maxMark}.`);
      }
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="align-middle inline-block min-w-full">
        <div className="shadow-sm border border-gray-200 dark:border-gray-700 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Student ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Mark (0-{maxMark})
                </th>
                <th scope="col" className="relative px-6 py-3 w-28 text-right">
                  <span className="sr-only">Actions</span>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {marks.map((item) => {
                const isEditing = item.id === editingId;
                return (
                  <tr key={item.id} className={`${isEditing ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedMark?.studentId || ''}
                          onChange={(e) => handleInputChange('studentId', e.target.value)}
                          className="w-full bg-transparent border-b border-indigo-500 p-0 focus:ring-0 text-sm text-gray-900 dark:text-white"
                          autoFocus
                        />
                      ) : (
                        <span className="text-sm text-gray-900 dark:text-gray-200">{item.studentId}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <div>
                          <input
                            type="number"
                            value={editedMark?.mark ?? ''}
                            onChange={(e) => handleInputChange('mark', e.target.value)}
                            min="0"
                            max={maxMark}
                            className={`w-24 bg-transparent border-b p-0 focus:ring-0 text-sm text-gray-900 dark:text-white ${validationError ? 'border-red-500' : 'border-indigo-500'}`}
                          />
                          {validationError && <p className="text-xs text-red-500 mt-1">{validationError}</p>}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-900 dark:text-gray-200">{item.mark ?? 'N/A'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isEditing ? (
                        <div className="flex items-center justify-end space-x-3">
                          <button onClick={handleSave} disabled={!!validationError} className="text-green-500 hover:text-green-700 disabled:text-gray-400 disabled:cursor-not-allowed" aria-label="Save changes">
                            <CheckIcon className="w-5 h-5" />
                          </button>
                          <button onClick={cancelEditing} className="text-gray-400 hover:text-gray-600" aria-label="Cancel editing">
                            <CloseIcon className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end space-x-3">
                          <button onClick={() => startEditing(item)} className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400" aria-label="Edit row">
                            <PenIcon className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400" aria-label="Delete row">
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};