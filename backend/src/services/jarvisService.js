import { GoogleGenAI } from "@google/genai";
import { config } from "../config/env.js";

const ai = new GoogleGenAI({
  apiKey: config.geminiApiKey
});

const SYSTEM_INSTRUCTION = `
You are JARVIS, a personal AI voice assistant.

Your personality:
- Calm
- Intelligent
- Helpful
- Professional
- Slightly futuristic

You are speaking to the user through voice.

Keep responses concise and natural because your response
will be spoken aloud.

Do not use markdown unless necessary.

For simple questions, answer in one or two sentences.

Examples:

User: What is 2 + 2?
JARVIS: 2 + 2 is 4, sir.

User: Who are you?
JARVIS: I am JARVIS, your personal AI assistant.

User: How are you?
JARVIS: All systems are operational, sir.
`;

const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const trySimpleMath = (command) => {
  const expression = command.replace(/what is|calculate|equals|equal to/gi, "").replace(/\?/g, "").trim();
  if (!/^[\d\s()+\-*/.]+$/.test(expression) || !/[+\-*/]/.test(expression)) return null;
  try {
    const result = Function(`"use strict"; return (${expression})`)();
    return typeof result === "number" && Number.isFinite(result) ? `The answer is ${result}.` : null;
  } catch { return null; }
};

export const processCommand = async (command) => {
  if (!command || !command.trim()) {
    return {
      response: "I didn't hear anything.",
      action: "none"
    };
  }

  const mathAnswer = trySimpleMath(command);
  if (mathAnswer) return { response: mathAnswer, action: "calculation" };

  for (const model of models) {
    try {
      console.log(`Trying Gemini model: ${model}`);

      let response;
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          response = await ai.models.generateContent({ model, contents: command, config: { systemInstruction: SYSTEM_INSTRUCTION } });
          break;
        } catch (error) {
          if ((error.status === 503 || error.status === 429) && attempt < 2) { await wait(800); continue; }
          throw error;
        }
      }

      const answer = response.text;

      console.log(`Gemini response received from: ${model}`);

      return {
        response: answer,
        action: "ai_response",
        model
      };

    } catch (error) {
      console.error(
        `Gemini model ${model} failed:`,
        error.status,
        error.message
      );

      // Try the next model only for temporary server/demand errors
      if (error.status === 503 || error.status === 429) {
        console.log(`Trying fallback model...`);
        continue;
      }

      // Authentication / invalid request errors shouldn't
      // be hidden by trying other models.
      return {
        response:
          "There is a problem with my AI configuration. Please check the Gemini API settings.",
        action: "error"
      };
    }
  }

  return {
    response:
      "My AI service is temporarily busy. Your API key is working; please try again in a moment.",
    action: "temporary_error",
    retryable: true
  };
};
