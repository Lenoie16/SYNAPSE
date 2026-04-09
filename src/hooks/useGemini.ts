import { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Snippet } from '@/types';

export const useGemini = (apiKey: string) => {
  const [isApiKeyValid, setIsApiKeyValid] = useState<boolean | null>(null);

  const validateApiKey = useCallback(async () => {
    if (!apiKey) {
      setIsApiKeyValid(false);
      return;
    }
    try {
      const genAI = new GoogleGenAI({ apiKey });
      // Use a lightweight model and simple prompt for validation
      await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "hello",
      });
      setIsApiKeyValid(true);
    } catch (error) {
      console.error("API key validation failed:", error);
      setIsApiKeyValid(false);
    }
  }, [apiKey]);

  const categorizeSnippets = useCallback(async (snippets: Snippet[]): Promise<Record<string, string[]>> => {
    if (!apiKey) throw new Error("Gemini API key not found.");

    const genAI = new GoogleGenAI({ apiKey });
    
    const prompt = `Given the following code snippets, categorize them into sections. 
    Each snippet has a 'title' and 'code'. 
    Return a JSON object where keys are the new section titles and values are arrays of snippet titles that belong to that section.

    Snippets: ${JSON.stringify(snippets.map(s => ({title: s.title, code: s.code})))}`

    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
        }
      });
      const text = response.text;
      if (!text) {
        throw new Error("Empty response from API.");
      }
      return JSON.parse(text);
    } catch (error) { 
      console.error("Error categorizing snippets:", error);
      throw new Error("Failed to categorize snippets.");
    }
  }, [apiKey]);

  const debugCode = useCallback(async (code: string): Promise<{ error: string; fix: string }> => {
    if (!apiKey) throw new Error("Gemini API key not found.");

    const genAI = new GoogleGenAI({ apiKey });

    const prompt = `Analyze the following code for errors and suggest fixes. 
    Provide a brief explanation of the error and the corrected code.
    Return a JSON object with 'error' and 'fix' properties.

    Code:
    ${code}`;

    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
        }
      });
      const text = response.text;
      if (!text) {
        throw new Error("Empty response from API.");
      }
      return JSON.parse(text);
    } catch (error) {
      console.error("Error debugging code:", error);
      throw new Error("Failed to debug code.");
    }
  }, [apiKey]);

  const analyzeCode = useCallback(async (code: string): Promise<{ type: 'code' | 'prompt' | 'natural_language'; summary?: string; error?: string; fix?: string }> => {
    if (!apiKey) throw new Error("Gemini API key not found.");

    const genAI = new GoogleGenAI({ apiKey });

    const prompt = `Analyze the following text. First, classify it as 'code', 'prompt', or 'natural_language'.
    - If it's 'code', provide a one-line summary, and check for bugs. If bugs are found, provide an 'error' and 'fix'.
    - If it's 'prompt', provide a one-line summary of what the prompt is asking the AI to do.
    - If it's 'natural_language', return an empty object.
    Return a JSON object with a 'type' field, and other fields depending on the type. For 'code' and 'prompt', include a 'summary'. For 'code' with errors, include 'error' and 'fix'.

    Text:
    ${code}`;

    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
        }
      });
      const text = response.text;
      if (!text) {
        throw new Error("Empty response from API.");
      }
      return JSON.parse(text);
    } catch (error) {
      console.error("Error analyzing code:", error);
      throw new Error("Failed to analyze code.");
    }
  }, [apiKey]);

  const analyzeFileContent = useCallback(async (content: string): Promise<{ summary: string }> => {
    if (!apiKey) throw new Error("Gemini API key not found.");

    const genAI = new GoogleGenAI({ apiKey });

    const prompt = `Summarize the following file content in one line.\n\nContent:\n${content}`;

    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
        }
      });
      const text = response.text;
      if (!text) {
        throw new Error("Empty response from API.");
      }
      return JSON.parse(text);
    } catch (error) {
      console.error("Error analyzing file content:", error);
      throw new Error("Failed to analyze file content.");
    }
  }, [apiKey]);

  const categorizeFiles = useCallback(async (files: { name: string; content: string }[]): Promise<Record<string, string[]>> => {
    if (!apiKey) throw new Error("Gemini API key not found.");

    const genAI = new GoogleGenAI({ apiKey });

    const prompt = `Given the following files, categorize them into sections. 
    Each file has a 'name' and 'content'. 
    Return a JSON object where keys are the new section titles and values are arrays of file names that belong to that section.

    Files: ${JSON.stringify(files)}`

    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
        }
      });
      const text = response.text;
      if (!text) {
        throw new Error("Empty response from API.");
      }
      return JSON.parse(text);
    } catch (error) {
      console.error("Error categorizing files:", error);
      throw new Error("Failed to categorize files.");
    }
  }, [apiKey]);

  return { isApiKeyValid, validateApiKey, categorizeSnippets, debugCode, analyzeCode, analyzeFileContent, categorizeFiles };
};
