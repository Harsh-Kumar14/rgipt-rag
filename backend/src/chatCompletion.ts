import type { messageSchema } from "./types.js"
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export const chatCompletion = async (data: messageSchema) => {
    const content: string  = data.message;
    const response = await ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: content,
    });
}