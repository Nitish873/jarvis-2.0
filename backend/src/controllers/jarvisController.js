import { processCommand } from "../services/jarvisService.js";

export const handleCommand = async (req, res) => {
  try {
    const { command } = req.body;
    if (typeof command !== "string" || !command.trim()) return res.status(400).json({ success: false, message: "Command is required." });
    const result = await processCommand(command);
    if (result.action === "temporary_error") return res.status(503).json({ success: false, ...result });
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("Jarvis error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong." });
  }
};
