import { processCommand } from "../services/jarvisService.js";

export const handleCommand = async (req, res) => {
  try {
    const command = req.body.command ?? req.body.message;
    if (typeof command !== "string" || !command.trim()) return res.status(400).json({ success: false, message: "Command is required." });
    const result = await processCommand(command);
    if (result.action === "temporary_error") return res.status(503).json({ success: false, ...result });
    return res.json({ success: result.success !== false, ...result });
  } catch (error) {
    console.error("JARVIS COMMAND ERROR:", error);
    const status = error.status === 401 || error.status === 403 ? 502 : 500;
    return res.status(status).json({
      success: false,
      message: "Gemini API error.",
      error: error.message || "Unknown Gemini error."
    });
  }
};
