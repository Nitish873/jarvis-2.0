import { GoogleGenAI } from "@google/genai";
import { config } from "../config/env.js";
import { playYoutube, pauseYoutube, resumeYoutube, nextYoutube, stopYoutube, setYoutubeVolume } from "../tools/youtubeTool.js";

const ai = new GoogleGenAI({
  apiKey: config.geminiApiKey
});

console.log("Gemini key exists:", Boolean(config.geminiApiKey));

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

// Keep the model list on generally available Gemini API model IDs. A retired
// model returns 404 and must not be treated as an API-key configuration error.
const models = [config.geminiModel];
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const trySimpleMath = (command) => {
  const expression = command.replace(/what is|calculate|equals|equal to/gi, "").replace(/\?/g, "").trim();
  if (!/^[\d\s()+\-*/.]+$/.test(expression) || !/[+\-*/]/.test(expression)) return null;
  try {
    const result = Function(`"use strict"; return (${expression})`)();
    return typeof result === "number" && Number.isFinite(result) ? `The answer is ${result}.` : null;
  } catch { return null; }
};

const youtubeIntent = async (command) => {
  const text = command.trim();
  if (/^(open\s+)?chrome$/i.test(text)) return { success: true, action: "OPEN_CHROME", message: "Opening Chrome." };
  if (/^(open\s+)?youtube$/i.test(text)) return { success: true, action: "OPEN_YOUTUBE", message: "Opening YouTube." };
  const googleSearch = text.match(/^(?:search(?:\s+for)?|google)\s+(.+)$/i);
  if (googleSearch) return { success: true, action: "SEARCH_GOOGLE", searchQuery: googleSearch[1].trim(), message: `Searching Google for ${googleSearch[1].trim()}.` };
  if (/^(play\s+)?(my\s+)?playlist$/i.test(text)) return config.youtubePlaylistUrl
    ? { success: true, action: "PLAY_PLAYLIST", playlistUrl: config.youtubePlaylistUrl, message: "Playing your playlist." }
    : { success: false, action: "PLAY_PLAYLIST", message: "Your YouTube playlist has not been configured yet." };
  const volume = text.match(/(?:volume|sound)(?:\s+to|\s+at)?\s+(\d{1,3})/i);
  if (volume) return setYoutubeVolume(volume[1]);
  if (/^pause(?:\s+the)?\s*(youtube|video|music)?$/i.test(text)) return pauseYoutube();
  if (/^stop(?:\s+the)?\s*(youtube|video|music)?$/i.test(text)) return stopYoutube();
  if (/^(resume|continue)(?:\s+the)?\s*(youtube|video|music)?$/i.test(text)) return resumeYoutube();
  if (/^(next|skip)(?:\s+to)?(?:\s+the)?\s*(video|song|youtube)?$/i.test(text)) return nextYoutube();
  const play = text.match(/^(?:play|search for|find)\s+(.+?)(?:\s+on\s+youtube)?$/i);
  if (play) return playYoutube(play[1].trim());
  return null;
};

export const processCommand = async (command) => {
  if (!command || !command.trim()) {
    return {
      response: "I didn't hear anything.",
      action: "none"
    };
  }

  if (!config.geminiApiKey) {
    return {
      response: "My Gemini API key is missing. Add GEMINI_API_KEY to backend/.env and restart the backend.",
      action: "error"
    };
  }

  const mathAnswer = trySimpleMath(command);
  if (mathAnswer) return { response: mathAnswer, action: "calculation" };

  const youtubeResult = await youtubeIntent(command);
  if (youtubeResult) return { response: youtubeResult.message || youtubeResult.error, action: youtubeResult.action, success: youtubeResult.success !== false, toolResult: youtubeResult };

  let lastGeminiError;
  for (const model of models) {
    try {
      console.log(`Trying Gemini model: ${model}`);

      let response;
      for (let attempt = 1; attempt <= 1; attempt += 1) {
        try {
          console.log(`Calling Gemini with model: ${model}`);
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
      lastGeminiError = error;
      console.error("GEMINI API ERROR", { model, name: error.name, status: error.status, message: error.message });

      // A 404 can mean the model is retired or unavailable for this account.
      // Continue to the next configured model in that case.
      if (error.status === 404 || error.status === 503 || error.status === 429) {
        console.log(`Trying fallback model...`);
        continue;
      }

      // Authentication / invalid request errors shouldn't
      // be hidden by trying other models.
      throw error;
    }
  }

  throw lastGeminiError || new Error("Gemini request failed without an error response.");
};
