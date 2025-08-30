
export interface StudentMark {
  id: string; // A unique ID for React key props and state updates
  studentId: string;
  mark: number | null; // Allow null if a mark is not found or invalid
}

export interface Session {
  id: string;
  name: string;
  maxMark: number;
  marks: StudentMark[];
  createdAt: string; // ISO String for date
}
