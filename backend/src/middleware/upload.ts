import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate storage path based on current date
 */
function getStoragePath(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  const dirPath = path.join(config.storage.dir, String(year), month, day);
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  return dirPath;
}

/**
 * Multer storage configuration
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const storagePath = getStoragePath();
    cb(null, storagePath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

/**
 * File filter for images only
 */
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (config.storage.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG and PNG images are allowed.'));
  }
};

/**
 * Multer upload instance
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.storage.maxFileSize,
  },
});
