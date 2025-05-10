import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { createClient } from "redis";
import mongoose, { Document, Schema } from "mongoose";

const {
  PORT = "4000",
  FIRST_NAME = "User",
  REDIS_HOST,
  REDIS_PORT,
  REDIS_USER,
  REDIS_PASS,
  MONGO_URI,
} = process.env;

const COLLECTION = `FULLSTACK_TASK_${FIRST_NAME}`;

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// Redis client
const redisClient = createClient({
  socket: { host: REDIS_HOST, port: Number(REDIS_PORT) },
  username: REDIS_USER,
  password: REDIS_PASS,
});
redisClient.connect().catch(console.error);

// Mongoose Task model
interface Task {
  text: string;
  createdAt: Date;
}
type TaskDoc = Task & Document;

const taskSchema = new Schema<TaskDoc>({
  text: { type: String, required: true },
  createdAt: { type: Date, required: true },
});

const TaskModel = mongoose.model<TaskDoc>("Task", taskSchema, COLLECTION);

mongoose
  .connect(MONGO_URI!)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Shared storage logic
async function storeTask(text: string): Promise<Task> {
  const payload = JSON.stringify({ text, createdAt: new Date() });
  await redisClient.rPush(COLLECTION, payload);

  const count = await redisClient.lLen(COLLECTION);
  if (count > 50) {
    const all = await redisClient.lRange(COLLECTION, 0, -1);
    const docs = all.map((s) => JSON.parse(s));
    await TaskModel.insertMany(docs);
    await redisClient.del(COLLECTION);
  }

  return JSON.parse(payload);
}

// WebSocket handler
io.on("connection", (socket) => {
  socket.on("add", async (taskText: string) => {
    const task = await storeTask(taskText);
    io.emit("newTask", task);
  });
});

// HTTP POST /addTask
app.post("/addTask", async (req: Request, res: Response): Promise<void> => {
  const { text } = req.body;
  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "Invalid task text" });
    return; // <— return void
  }

  const task = await storeTask(text);
  io.emit("newTask", task);
  res.status(201).json(task);
  // no `return res…`
});

// HTTP GET /fetchAllTasks
app.get(
  "/fetchAllTasks",
  async (_req: Request, res: Response): Promise<void> => {
    let items = await redisClient.lRange(COLLECTION, 0, -1);

    if (items.length === 0) {
      const saved = await TaskModel.find().lean();
      items = saved.map((t) => JSON.stringify(t));
    }

    res.json(items.map((s) => JSON.parse(s)));
    // no return
  }
);

// Start
server.listen(Number(PORT), () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
