import * as fs from 'fs';

/**
 * Ensure a directory exists, creating it if necessary
 * @param dirPath Path to the directory
 */
export const ensureDirectoryExists = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};
