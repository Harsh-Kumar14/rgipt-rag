
import { Collection, DataAPIClient } from "@datastax/astra-db-ts";
//import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer"
import { GoogleGenAI } from "@google/genai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import dotenv from "dotenv";
import { Router } from "express";

const router = Router();

dotenv.config();

// enum similarityMetric {
//     "dot_product",
//     "cosine",
//     "euclidean"
// }
type similarityMetric = "dot_product" | "cosine" | "euclidean"

const {ASTRA_DB_APPLICATION_TOKEN, ASTRA_DB_COLLECTION, ASTRA_DB_NAMESPACE, ASTRA_DB_API_ENDPOINT, GEMINI_API_KEY} = process.env;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY as string });

const f1Data = [
    "https://en.wikipedia.org/wiki/Formula_One",
]


const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT as string, {keyspace: ASTRA_DB_NAMESPACE as string});


const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 100
})

const createcollection = async (similarityMetric: similarityMetric = "dot_product") => {
    const res = await db.createCollection(ASTRA_DB_COLLECTION as string, {
        vector: {
            dimension: 1536,
            metric: similarityMetric
        }
    })
}


const scrapePage = async (url: string): Promise<string> => {
    const loader = new PuppeteerWebBaseLoader(url, {
        launchOptions: {
            headless: true
        },
        gotoOptions: {
            waitUntil: "domcontentloaded"
        },
        evaluate: async (page, browser) => {
            const result = await page.evaluate(() => document.body.innerHTML);
            await browser.close();
            return result;
        }
    });
    return (await loader.scrape())?.replace(/<[^>]*>?/gm, '');
};

const loadData = async () => {
    const Collection = await db.collection(ASTRA_DB_COLLECTION as string);
    for (const url of f1Data) {
        const content = await scrapePage(url);
        const chunk = await splitter.splitText(content);
        for (const el of chunk) {
            const response = await ai.models.embedContent({
                model: 'gemini-embedding-001',
                contents: el,

            });
            console.log(response);
            
            if (response.embeddings && response.embeddings.length > 0 && response.embeddings[0]?.values) {
                let vector = response.embeddings[0].values;
                // Ensure vector is exactly 1536 dimensions
                if (vector.length > 1536) {
                    vector = vector.slice(0, 1536);
                } else if (vector.length < 1536) {
                    // Pad with zeros if too short (rare)
                    vector = vector.concat(Array(1536 - vector.length).fill(0));
                }
                const res = await Collection.insertOne({
                    $vector: vector,
                    text: el
                });
                console.log(res);
            } else {
                console.error("No embeddings returned for content chunk.");
            }
        }
    }
}

export const main = async () => {
    await createcollection();
    await loadData();

}
