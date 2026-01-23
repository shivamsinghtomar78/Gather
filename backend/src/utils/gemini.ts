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
/**
 * Uses Gemini to answer a question based on provided context.
 */
export async function chatWithContext(query: string, context: string): Promise<string> {
    try {
        if (!process.env.GEMINI_API_KEY) return "AI Chat is currently unavailable.";

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `You are "Brain AI", a helpful assistant for a second brain application called Gather.
        The user is asking a question about their saved notes and content.
        
        Use the provided context to answer the question as accurately as possible. If the answer isn't in the context, be honest and say you don't have that information.
        
        CONTEXT:
        ${context}
        
        QUESTION:
        ${query}
        
        ANSWER:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("❌ Gemini Chat Error:", error);
        return "I encountered an error while processing your request.";
    }
}

/**
 * Uses Gemini to generate a cohesive summary of content related to a specific tag.
 */
export async function summarizeTagContent(tagName: string, contentList: { title: string; description?: string }[]): Promise<string> {
    try {
        if (!process.env.GEMINI_API_KEY) return "Summarization is currently unavailable.";

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const contentContext = contentList
            .map(c => `- ${c.title}${c.description ? `: ${c.description}` : ''}`)
            .join('\n');

        const prompt = `You are a knowledge assistant. Summarize the following collection of notes and links categorized under the tag "${tagName}".
        Provide a high-level overview of the themes, key takeaways, and any patterns you see.
        Keep it concise (1-2 paragraphs) and highly informative.
        
        CONTENT:
        ${contentContext}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("❌ Gemini Summarization Error:", error);
        return "I encountered an error while summarizing this tag.";
    }
}

/**
 * Uses Gemini Vision to extract text and suggest organization from an image.
 */
export async function extractTextFromImage(base64Image: string): Promise<{ title: string; description: string; tags: string[] }> {
    try {
        if (!process.env.GEMINI_API_KEY) throw new Error("API Key missing");

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Remove data:image/...;base64, prefix if exists
        const base64Data = base64Image.split(',').pop() || base64Image;

        const prompt = `Analyze this image (likely a screenshot, photo of a note, or document). 
        1. Extract all readable text accurately.
        2. Suggest a concise Title for this content.
        3. Provide a brief Description/Summary.
        4. Suggest 3-4 relevant tags.
        
        Return the result ONLY as a JSON object with keys: "title", "description", "tags" (array of strings), and "extractedText".`;

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
                tags: data.tags || []
            };
        }

        return {
            title: "Extracted Content",
            description: text,
            tags: ["ocr"]
        };
    } catch (error) {
        console.error("❌ Gemini OCR Error:", error);
        throw error;
    }
}
/**
 * Uses Gemini to generate study flashcards from content.
 */
export async function generateFlashcards(title: string, description: string): Promise<{ question: string; answer: string }[]> {
    try {
        if (!process.env.GEMINI_API_KEY) return [];

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Based on the following content (Title and description/notes), generate 3-5 high-quality study flashcards.
        Each flashcard should have a clear "question" and a concise "answer".
        Return the result ONLY as a JSON array of objects with keys "question" and "answer".
        
        TITLE: ${title}
        DESCRIPTION: ${description}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return [];
    } catch (error) {
        console.error("❌ Gemini Flashcard Error:", error);
        return [];
    }
}
