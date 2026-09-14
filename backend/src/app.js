import express from "express";
import cors from "cors";
import jarvisRoutes from "./routes/jarvisRoutes.js";

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.get("/api/health", (_req, res) => res.json({ success: true, message: "JARVIS backend is running." }));
app.use("/api/jarvis", jarvisRoutes);
export default app;
