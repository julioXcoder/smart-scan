import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { StudentMark } from '../types';

// The global `ai` instance is restored to use a single, pre-configured API key.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const createPrompt = (maxMark: number) => `
    You are an advanced OCR specialist. Your primary function is to accurately extract handwritten and printed information from images of student mark sheets.
    Your task is to analyze the provided image with extreme precision. The sheet contains student registration numbers and their corresponding marks.

    **Core Instructions:**
    1.  **Extract Data Pairs:** Identify and extract all pairs of (Student Registration Number, Mark).
    2.  **Handwriting & Print:** Be highly effective at reading both printed text and a wide variety of handwriting styles (cursive, block letters, etc.). Be resilient to variations in ink color, pressure, and slight angling.
    3.  **Student IDs:** Student registration numbers can be complex and varied (e.g., 'T/UDOM/2021/12345', 'BS-CS-01-001/2020', alphanumeric strings). Capture them exactly as they appear. Do not invent or correct them.
    4.  **Marks:** Marks are the numerical values assigned to each student.
        - The maximum possible mark for any student is ${maxMark}. Any number extracted that is higher than this value is incorrect; in such cases, set the mark to null.
        - If a mark is illegible, crossed out, missing, or impossible to read with high confidence, its value must be null. Do not guess.
    5.  **Accuracy is Key:** Prioritize accuracy over quantity. It is better to return fewer, correct entries than many incorrect ones. Only include entries where you can clearly identify at least the student ID.
    6.  **JSON Output:** Return the data in the specified JSON format. The output must be a clean JSON array.
`;

const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        studentId: {
          type: Type.STRING,
          description: "The student's registration number, precisely as it appears on the sheet.",
        },
        mark: {
          type: Type.NUMBER,
          description: "The student's corresponding numerical mark. Should be null if not found or illegible.",
        },
      },
      required: ["studentId", "mark"],
    },
};

export const extractMarksFromImage = async (
    base64Image: string, 
    mimeType: string, 
    maxMark: number
): Promise<Omit<StudentMark, 'id'>[]> => {
    
    try {
        const imagePart = {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
        };

        const prompt = createPrompt(maxMark);

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            },
        });

        const jsonText = response.text.trim();
        const data = JSON.parse(jsonText);
        
        if (Array.isArray(data)) {
            return data.map((item: any) => ({
                studentId: item.studentId || '',
                mark: (typeof item.mark === 'number' && item.mark >= 0 && item.mark <= maxMark) ? item.mark : null,
            })).filter(item => item.studentId); // Ensure studentId is not empty
        }

        return [];

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('400'))) {
             throw new Error("The API key is not valid. The application administrator needs to check it.");
        }
        throw new Error("Failed to extract marks from the image. The API may be rate-limited or the image is unreadable.");
    }
};
