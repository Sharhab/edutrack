import multer from "multer";

/* =========================================
   MULTER MEMORY STORAGE
========================================= */

const storage = multer.memoryStorage();

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
