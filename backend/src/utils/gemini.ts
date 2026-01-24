import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Generates an embedding for a given text using Gemini.
 * Currently uses text-embedding-004 which is standard for embeddings.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not defined in environment variables");
        }

        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent(text);

        return result.embedding.values;
    } catch (error) {
        console.error("❌ Gemini Embedding Error:", error);
        throw error;
    }
}

/**
 * Uses Gemini Vision to extract text from an image.
 */
export async function extractTextFromImage(base64Image: string): Promise<{ title: string; description: string }> {
    try {
        if (!process.env.GEMINI_API_KEY) throw new Error("API Key missing");

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Remove data:image/...;base64, prefix if exists
        const base64Data = base64Image.split(',').pop() || base64Image;

        const prompt = `Analyze this image (likely a screenshot, photo of a note, or document). 
        1. Extract all readable text accurately.
        2. Suggest a concise Title for this content.
        3. Provide a brief Description/Summary.
        
        Return the result ONLY as a JSON object with keys: "title", "description", and "extractedText".`;

        // Detect MIME type if possible, default to image/jpeg
        let mimeType = "image/jpeg";
        const mimeMatch = base64Image.match(/^data:(image\/[a-zA-Z]+);base64,/);
        if (mimeMatch) {
            mimeType = mimeMatch[1];
        }

        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            },
            {
                text: prompt
            }
        ]);

        const response = await result.response;
        const text = response.text();

        // Extract JSON from response (sometimes Gemini wraps it in markdown)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            return {
                title: data.title || "Image Snippet",
                description: `${data.description || ''}\n\nExtracted Text:\n${data.extractedText || ''}`,
            };
        }

        return {
            title: "Extracted Content",
            description: text,
        };
    } catch (error) {
        console.error("❌ Gemini OCR Error:", error);
        throw error;
    }
}
