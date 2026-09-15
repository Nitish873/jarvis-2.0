import app from "./app.js";
import { config } from "./config/env.js";

console.log("=================================");
console.log("Starting JARVIS backend...");
console.log("Gemini API key loaded:", Boolean(config.geminiApiKey));
console.log("Port:", config.port);
console.log("=================================");

const server = app.listen(config.port, () => {
  console.log(`JARVIS backend running on http://localhost:${config.port}`);
});

// Keep track of server errors
server.on("error", (error) => {
  console.error("❌ SERVER ERROR:");
  console.error(error);
});

// Confirm that the server is actually listening
server.on("listening", () => {
  console.log("✅ Server is actively listening.");
});

// Handle shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down JARVIS...");
  server.close(() => {
    console.log("JARVIS backend stopped.");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("\nShutting down JARVIS...");
  server.close(() => {
    process.exit(0);
  });
});