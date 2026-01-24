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

