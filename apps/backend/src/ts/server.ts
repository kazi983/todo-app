import express from "express";
import { createApp } from "./app.ts";

const PORT = Number(process.env.PORT ?? 3000);
const server = express();

server.use("/api", createApp());

server.listen(PORT, () => console.log(`app running on port: ${PORT}`));
