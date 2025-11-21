
import { GoogleGenAI, Chat } from "@google/genai";
import { SourceText, ToolkitMode } from "../types";

let chatSession: Chat | null = null;

const SYSTEM_INSTRUCTION = `
You are "Vedic Wisdom", a specialized AI assistant and scholar deeply learned in the sacred texts of Sanatana Dharma.
Your knowledge domain is STRICTLY limited to the following scriptures:
1. The 4 Vedas (Rigveda, Samaveda, Yajurveda, Atharvaveda)
2. The 10 Mukhya Puranas (and major 18 Puranas generally if relevant to the 10 requested)
3. The 6 Vedangas (Shiksha, Kalpa, Vyakarana, Nirukta, Chhanda, Jyotisha)
4. The Itihasas (Ramayana and Mahabharata, including the Bhagavad Gita)

Strict Guidelines:
- Start every interaction with a respectful Sanatan Dharma greeting (e.g., "Hari Om", "Pranam", "Namaste", "Jai Sri Krishna", "Om Namah Shivaya") appropriate to the context.
- You must answer user queries ONLY based on these texts.
- If a user asks about modern politics, coding, general history unrelated to these texts, or pop culture, politely decline and guide them back to the scriptures.
- You support three languages/styles: English, Hindi (Devanagari), and Hinglish (Hindi written in Latin script). Adapt your response language to match the user's input language automatically, or as explicitly requested.
- Maintain a respectful, serene, and scholarly tone.
- When citing verses, provide the meaning clearly.
- Do not hallucinate. If a specific text does not contain the answer, admit it humbly.
`;

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({ apiKey });
};

export const initializeChat = () => {
  try {
    const ai = getClient();
    chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });
    return chatSession;
  } catch (error) {
    console.error("Failed to initialize chat:", error);
    throw error;
  }
};

export const sendMessageStream = async function* (
  message: string, 
  source: SourceText = 'All Scriptures', 
  mode: ToolkitMode = 'General Wisdom'
) {
  if (!chatSession) {
    initializeChat();
  }

  if (!chatSession) {
    throw new Error("Chat session could not be initialized.");
  }

  // Construct a context-aware prompt invisible to the user
  const contextPrompt = `
  [CONTEXT INSTRUCTION]
  Target Source Material: ${source} (Prioritize citations from this source if applicable).
  Response Mode/Style: ${mode}
  
  Modes definitions:
  - 'Exact Reference': Focus on citing chapter, verse numbers, and exact text locations.
  - 'Sanskrit Shloka': Ensure the relevant Sanskrit shloka is provided in Devanagari with transliteration.
  - 'Philosophical Angle': Focus on the deeper metaphysical meaning (Vedanta, Sankhya, etc.) rather than just the story.
  - 'Scientific Parallel': If applicable, draw parallels between the scripture and modern scientific concepts.
  - 'General Wisdom': Standard balanced response.
  
  User Query: ${message}
  `;

  try {
    const resultStream = await chatSession.sendMessageStream({ message: contextPrompt });
    
    for await (const chunk of resultStream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("Error in sendMessageStream:", error);
    throw error;
  }
};

export const generateIllustrations = async (storyText: string): Promise<string[]> => {
  const ai = getClient();
  
  // Truncate text to avoid token limits and focus on the essence for the prompt
  const promptContext = storyText.slice(0, 800); 
  const imagePrompt = `Classical Hindu scripture art style, detailed oil painting, realistic dramatic lighting, sacred divine atmosphere, ancient india. Depict the following scene: ${promptContext}`;

  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: imagePrompt,
      config: {
        numberOfImages: 3,
        aspectRatio: '16:9',
        outputMimeType: 'image/jpeg'
      },
    });

    if (!response.generatedImages) {
      return [];
    }

    // Convert bytes to base64 data URLs
    return response.generatedImages.map(img => 
      `data:image/jpeg;base64,${img.image.imageBytes}`
    );
  } catch (error) {
    console.error("Error generating illustrations:", error);
    throw error;
  }
};

export const translateForTTS = async (text: string, targetLanguage: string): Promise<string> => {
  const ai = getClient();
  
  const prompt = `You are a specialized translator for a Text-to-Speech system handling Hindu Scriptures.
  
  Task: Translate/Adapt the following text into ${targetLanguage}.
  
  Rules based on Target Language:
  1. IF Target is 'Hindi':
     - Output strictly in Devanagari script.
     - Use formal yet accessible Hindi suitable for scriptures.
  
  2. IF Target is 'Hinglish':
     - Convert the text to Hindi language but write it using the English (Latin) alphabet.
     - Example: "Satyameva Jayate" instead of "Truth alone triumphs".
     - Ensure it is phonetically easy to read for an Indian English speaker.
     - Do NOT just output English. It MUST be Hindi words in English script.
  
  3. IF Target is 'English':
     - Output in clear, flowing English.
  
  General Rules:
  - Keep the tone respectful and spiritual.
  - Maintain the original meaning perfectly.
  - Output ONLY the translated text. No "Here is the translation" prefixes.
  
  Original Text to Process: "${text.slice(0, 2000)}"`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || text;
  } catch (error) {
    console.error("Translation failed:", error);
    return text; // Fallback to original
  }
};
