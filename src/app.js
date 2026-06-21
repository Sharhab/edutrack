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
   ALLOWED ORIGINS
========================================= */

function isAllowedOrigin(origin) {
  if (!origin) return true;

  try {
    const hostname = new URL(origin).hostname;

    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "edutrack.cloud" ||
      hostname === "www.edutrack.cloud"
    ) {
      return true;
    }

    if (hostname.endsWith(".edutrack.cloud")) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/* =========================================
   CORS
========================================= */

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      console.log("❌ CORS BLOCKED:", origin);

      callback(
        new Error(
          `Origin not allowed: ${origin}`
        )
      );
    }
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],

  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

/* IMPORTANT */
app.options(/.*/, cors(corsOptions));

/* =========================================
   BODY PARSERS
========================================= */

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(cookieParser());

/* =========================================
   STATIC FILES
========================================= */

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "../uploads")
  )
);

/* =========================================
   DEBUG REQUESTS
========================================= */

app.use((req, res, next) => {
  console.log(
    `${req.method} ${req.originalUrl}`
  );

  console.log(
    "Origin:",
    req.headers.origin
  );

  next();
});

/* =========================================
   ROUTES
========================================= */

app.use("/api", routes);

/* =========================================
   NOT FOUND
========================================= */

app.use(notFoundHandler);

/* =========================================
   ERROR HANDLER
========================================= */

app.use(errorHandler);

export default app;