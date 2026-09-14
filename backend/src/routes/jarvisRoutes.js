import express from "express";
import { handleCommand } from "../controllers/jarvisController.js";

const router = express.Router();
router.post("/command", handleCommand);
router.post("/", handleCommand);
export default router;
