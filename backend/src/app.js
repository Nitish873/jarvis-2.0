import express from "express";
import cors from "cors";

import jarvisRouter from "./routes/jarvisRoutes.js";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    name: "JARVIS",
    status: "online",
  });
});

app.use("/api/jarvis", jarvisRouter);

export default app;