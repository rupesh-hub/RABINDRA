import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// Ensure upload directory exists
const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

// Initialize the base directory
ensureDirectoryExists(UPLOAD_DIR);

const createStorage = (folder) => {
  const folderPath = path.join(UPLOAD_DIR, folder);
  ensureDirectoryExists(folderPath);

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, folderPath);
    },
    filename: (req, file, cb) => {
      const uniqueFileName = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueFileName);
    },
  });
};

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(
      new Error("Only image files (jpg, jpeg, png, gif, webp) are allowed!"),
      false
    );
  }
};

const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB limit
};

// Middleware for note image uploads with Promise-based error handling
export const noteImagesUpload = (req, res, next) => {
  return new Promise((resolve, reject) => {
    const upload = multer({
      storage: createStorage("notes"),
      fileFilter,
      limits,
    }).array("images", 10);

    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        return reject({
          status: 400,
          message: err.message || "File upload error"
        });
      } else if (err) {
        // An unknown error occurred when uploading.
        return reject({
          status: 500,
          message: err.message || "Unknown upload error"
        });
      }
      
      // No error, resolve the promise
      resolve();
    });
  });
};

// Async wrapper for the note images upload middleware
export const noteImagesUploadMiddleware = async (req, res, next) => {
  try {
    await noteImagesUpload(req, res);
    next();
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Upload failed",
    });
  }
};

// For profile images
export const profileUpload = multer({
  storage: createStorage("profiles"),
  fileFilter,
  limits,
}).single("profile");