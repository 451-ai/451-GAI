import { GoogleGenAI, Type } from "@google/genai";
import { ExtractionResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `You are a professional bank statement OCR specialist.
Your task is to extract EVERY SINGLE transaction from the provided bank statement (PDF or Image).
Follow these strict rules:
1. Extract Date, Description, Amount, Category, and Notes.
2. Date format: YYYY-MM-DD.
3. Amount format: A number. Positive for deposits/credits, negative for expenses/debits.
4. Category: Auto-detect the category (Groceries, Dining, Transport, Salary, Bills, Entertainment, Health, Shopping, Transfer, etc.) based on the description.
5. Notes: Any additional context (e.g. check number, specific location, or remaining balance if relevant).
6. IF the user provides multiple pages, extract transactions from ALL of them.
7. SKIP headers, footers, summary tables, totals, and any row that is NOT a transaction.
8. Be precise. Do not invent data.`;

export async function extractTransactionsFromFiles(files: { data: string, mimeType: string }[]): Promise<ExtractionResponse> {
  const parts = files.map(file => ({
    inlineData: {
      data: file.data.split(',')[1] || file.data, // Remove base64 prefix if present
      mimeType: file.mimeType,
    },
  }));

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        ...parts,
        { text: "Extract all transactions from these documents into the specified JSON format." }
      ]
    },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transactions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: {
                  type: Type.STRING,
                  description: "Date in YYYY-MM-DD format",
                },
                description: {
                  type: Type.STRING,
                  description: "Transaction description or merchant name",
                },
                amount: {
                  type: Type.NUMBER,
                  description: "Transaction amount (negative for expenses, positive for income)",
                },
                category: {
                  type: Type.STRING,
                  description: "Categorized merchant type",
                },
                notes: {
                  type: Type.STRING,
                  description: "Additional context or details",
                },
              },
              required: ["date", "description", "amount", "category"],
            },
          },
        },
        required: ["transactions"],
      },
    },
  });

  try {
    const rawText = response.text || "{}";
    const data = JSON.parse(rawText) as ExtractionResponse;
    return data;
  } catch (error) {
    console.error("Failed to parse extraction results:", error);
    throw new Error("The model returned invalid transaction data. Please try again.");
  }
}
