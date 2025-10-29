import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

/**
 * Generate thumbnail from image
 */
export async function generateThumbnail(
  originalPath: string,
  width: number = 320
): Promise<string> {
  const ext = path.extname(originalPath);
  const dir = path.dirname(originalPath);
  const basename = path.basename(originalPath, ext);
  const thumbPath = path.join(dir, `${basename}_${width}${ext}`);
  
  await sharp(originalPath)
    .resize(width, null, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 80 })
    .toFile(thumbPath);
  
  return thumbPath;
}

/**
 * Convert absolute path to relative URL
 */
export function pathToUrl(absolutePath: string, storageDir: string): string {
  const relativePath = path.relative(storageDir, absolutePath);
  return '/media/' + relativePath.replace(/\\/g, '/');
}
