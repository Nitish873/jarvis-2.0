import app from "./app.js";
import { config } from "./config/env.js";

console.log("Gemini API key loaded:", Boolean(config.geminiApiKey));

app.listen(config.port, () => {
  console.log(`JARVIS backend running on http://localhost:${config.port}`);
});