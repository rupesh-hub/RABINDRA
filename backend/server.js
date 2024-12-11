import express from "express";
import { connectDB } from "./database/db.connection.js";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./user/routes/auth.route.js";
import { errorHandler } from "./exception/error.handler.js";
import cookieParser from "cookie-parser";
import notesRoutes from "./note/route/note.routes.js";
import userRoutes from "./user/routes/user.routes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:4200",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Access-Control-Allow-Credentials",
    ],
  })
);
app.use(cookieParser());

// Define __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/notes", notesRoutes);

// Error handling middleware
app.use(errorHandler);

// Start the server
app.listen(port, () => {
  connectDB();
  console.log(`Server is running on ${port}`);
});
