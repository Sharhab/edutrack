import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

/* =========================================
   PATH SETUP
========================================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
 * utils/
 *   upload.js
 *
 * uploads/
 *   logos/
 *
 * Therefore:
 * ../uploads
 */
const uploadDir = path.join(
  __dirname,
  "../../uploads/logos"
);
/* =========================================
   ENSURE UPLOAD DIRECTORY EXISTS
========================================= */

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

console.log(
  "📁 Logo upload directory:",
  uploadDir
);

/* =========================================
   MULTER STORAGE
========================================= */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    const ext = path.extname(
      file.originalname
    );

    const safeName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${ext}`;

    cb(null, safeName);
  },
});

/* =========================================
   FILE FILTER
========================================= */

function fileFilter(req, file, cb) {
  const allowed = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ];

  if (!allowed.includes(file.mimetype)) {
    return cb(
      new Error(
        "Only png, jpg, jpeg, and webp files are allowed"
      )
    );
  }

  cb(null, true);
}

/* =========================================
   EXPORT
========================================= */

export const uploadLogo = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});
