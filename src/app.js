import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import routes from "./routes/index.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* =========================================
   SAFE CORS (PRODUCTION SAAS READY)
========================================= */

app.use(cors({
  origin: function (origin, callback) {
    // Allow server-to-server / Postman
    if (!origin) return callback(null, true);

    try {
      const hostname = new URL(origin).hostname;

      const isAllowed =
        hostname === "localhost" ||
        hostname === "edutrack.cloud" ||
        hostname === "www.edutrack.cloud" ||
        hostname.endsWith(".edutrack.cloud");

      if (isAllowed) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS: " + origin));

    } catch (err) {
      // If origin parsing fails, block safely
      return callback(new Error("Invalid origin"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

/* IMPORTANT: Handle preflight */
app.options("*", cors());

/* =========================================
   MIDDLEWARES
========================================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* =========================================
   STATIC FILES
========================================= */

app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);

/* =========================================
   API ROUTES
========================================= */

app.use("/api", routes);

/* =========================================
   ERROR HANDLERS
========================================= */

app.use(notFoundHandler);
app.use(errorHandler);

export default app;