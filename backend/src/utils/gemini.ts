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
 * Uses Gemini to suggest tags based on title and description.
 */
export async function suggestTags(title: string, description?: string): Promise<string[]> {
    try {
        if (!process.env.GEMINI_API_KEY) return [];

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Analyze the following content title and description. Suggest exactly 3-4 relevant, short, one-word tags (in lowercase) for organizing this in a second brain. Return ONLY the tags separated by commas, no other text.
        
        Title: ${title}
        Description: ${description || 'No description provided'}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return text.split(',')
            .map(tag => tag.trim().toLowerCase())
            .filter(tag => tag.length > 0 && tag.length < 20);
    } catch (error) {
        console.error("❌ Gemini Tag Suggestion Error:", error);
        return [];
    }
}
