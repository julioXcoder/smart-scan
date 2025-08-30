// services/mlKitService.ts
declare const google: any;
import { StudentMark } from '../types';

let textDetector: any = null;
let detectorPromise: Promise<any> | null = null;

/**
 * Initializes the ML Kit Text Detector.
 * It polls for the `google.mlkit` library to be available, as it's loaded from a script tag.
 * Caches the detector instance for subsequent calls.
 */
const getDetector = (): Promise<any> => {
    if (textDetector) {
        return Promise.resolve(textDetector);
    }

    if (detectorPromise) {
        return detectorPromise;
    }

    detectorPromise = new Promise((resolve, reject) => {
        const startTime = Date.now();
        const timeout = 10000; // 10 seconds

        const checkInterval = setInterval(() => {
            if (typeof google !== 'undefined' && google.mlkit?.vision?.createTextDetector) {
                clearInterval(checkInterval);
                google.mlkit.vision.createTextDetector()
                    .then((detector: any) => {
                        textDetector = detector;
                        resolve(detector);
                    })
                    .catch((err: any) => {
                        detectorPromise = null; // Allow retry
                        reject(err);
                    });
            } else if (Date.now() - startTime > timeout) {
                clearInterval(checkInterval);
                detectorPromise = null; // Allow retry
                reject(new Error('ML Kit OCR failed to load, likely due to an ad blocker or network issue. You can disable your ad blocker and try again, or switch to the Gemini engine in Settings.'));
            }
        }, 200); // Check every 200ms
    });

    return detectorPromise;
};


const createImageFromBase64 = (base64Data: string, mimeType: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = `data:${mimeType};base64,${base64Data}`;
    });
};

const parseTextBlocks = (blocks: any[], maxMark: number): Omit<StudentMark, 'id'>[] => {
    if (!blocks || blocks.length === 0) {
        return [];
    }

    const lines: { blocks: any[] }[] = [];
    if (blocks.length > 0) {
        // Group blocks into lines based on vertical position
        const sortedBlocks = [...blocks].sort((a, b) => a.boundingBox.y - b.boundingBox.y);
        
        let currentLine: any[] = [sortedBlocks[0]];
        for (let i = 1; i < sortedBlocks.length; i++) {
            const prevBlock = currentLine[currentLine.length - 1];
            const currentBlock = sortedBlocks[i];
            
            const prevCenterY = prevBlock.boundingBox.y + prevBlock.boundingBox.height / 2;
            const currentCenterY = currentBlock.boundingBox.y + currentBlock.boundingBox.height / 2;
            const avgHeight = (prevBlock.boundingBox.height + currentBlock.boundingBox.height) / 2;

            // If vertical distance is within a threshold, consider it the same line
            if (Math.abs(prevCenterY - currentCenterY) < avgHeight * 0.7) {
                currentLine.push(currentBlock);
            } else {
                lines.push({ blocks: currentLine.sort((a,b) => a.boundingBox.x - b.boundingBox.x) });
                currentLine = [currentBlock];
            }
        }
        lines.push({ blocks: currentLine.sort((a,b) => a.boundingBox.x - b.boundingBox.x) });
    }

    const results: Omit<StudentMark, 'id'>[] = [];

    // Heuristic parsing: Assume last number in a line is the mark
    lines.filter(l => l.blocks.length > 1).forEach(line => {
        const idParts: string[] = [];
        let mark: number | null = null;
        let markFound = false;

        const lineBlocks = line.blocks;
        // Iterate backwards to find the mark first
        for(let i = lineBlocks.length - 1; i >= 0; i--) {
            const block = lineBlocks[i];
            const text = block.text.trim();
            const num = parseFloat(text);
            
            if (!markFound && !isNaN(num) && /^\d{1,3}(\.\d{1,2})?$/.test(text) && num >= 0 && num <= maxMark) {
                mark = num;
                markFound = true;
            } else {
                idParts.unshift(text); // Everything else is part of the ID
            }
        }

        if (mark !== null && idParts.length > 0) {
            results.push({ studentId: idParts.join(' ').trim(), mark });
        }
    });

    return results;
};


export const extractMarksFromImageWithMLKit = async (
    base64Image: string,
    mimeType: string,
    maxMark: number
): Promise<Omit<StudentMark, 'id'>[]> => {
    try {
        const detector = await getDetector();
        const image = await createImageFromBase64(base64Image, mimeType);
        const blocks = await detector.detect(image);
        return parseTextBlocks(blocks, maxMark);

    } catch (error) {
        console.error("Error using ML Kit:", error);
        // Let the error propagate up to the UI component to be displayed
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("An unknown error occurred while using ML Kit.");
    }
};
