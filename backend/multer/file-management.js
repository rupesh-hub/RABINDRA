import fs from "fs";
import path from "path";

const BASE_UPLOAD_DIR = path.join(process.cwd(), "uploads");

const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

ensureDirectoryExists(BASE_UPLOAD_DIR);

export const filePath = (folder, filename) => {
  return filename ? `/uploads/${folder}/${filename}` : null;
};

export const fullFilePath = (folder, filename) => {
  return filename ? path.join(BASE_UPLOAD_DIR, folder, filename) : null;
};

export const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
};


export const profilePath = (filename) => filePath("profiles", filename);


export const noteImagePath = (filename) => filePath("notes", filename);

// Ensure specific directories exist
ensureDirectoryExists(path.join(BASE_UPLOAD_DIR, "profiles"));
ensureDirectoryExists(path.join(BASE_UPLOAD_DIR, "notes"));
