import { readFile, readdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

const READABLE_EXTENSIONS = new Set(['.json', '.md', '.txt', '.yaml', '.yml']);

/**
 * Recursively reads files from a directory, filtering by readable extensions.
 */
async function readDirectory(dirPath: string): Promise<string> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const chunks: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // Skip hidden dirs
      if (!entry.name.startsWith('.')) {
        chunks.push(await readDirectory(fullPath));
      }
    } else if (READABLE_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      try {
        const content = await readFile(fullPath, 'utf-8');
        chunks.push(`\n--- ${fullPath} ---\n${content}`);
      } catch {
        // Skip unreadable files silently
      }
    }
  }

  return chunks.join('\n');
}

/**
 * Load external context from the configured paths.
 * Each path can be a file or directory.
 * Directories are read recursively for .json, .md, .txt files.
 */
export async function loadExternalContext(paths: string[]): Promise<string> {
  if (paths.length === 0) return '';

  const chunks: string[] = [];

  for (const path of paths) {
    try {
      const info = await stat(path);

      if (info.isDirectory()) {
        chunks.push(await readDirectory(path));
      } else {
        const content = await readFile(path, 'utf-8');
        chunks.push(`\n--- ${path} ---\n${content}`);
      }
    } catch {
      console.warn(`[context] Could not read: ${path}`);
    }
  }

  return chunks.join('\n');
}
