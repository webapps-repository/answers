// /api/utils/file-validators.js
import fs from "fs";

const BLOCKED_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".sh", ".msi", ".apk",
  ".dll", ".scr", ".com", ".js", ".php", ".py"
];

/**
 * Rejects any executable or dangerous file.
 * Allows all common document & image formats.
 */
export function validateUploadedFile(file) {
  if (!file || !file.originalFilename) {
    return { ok: false, error: "Invalid file" };
  }

  const name = file.originalFilename.toLowerCase();

  for (const ext of BLOCKED_EXTENSIONS) {
    if (name.endsWith(ext)) {
      return { ok: false, error: `Blocked file type: ${ext}` };
    }
  }

  // Size limit (12MB)
  if (file.size > 12 * 1024 * 1024) {
    return { ok: false, error: "File too large" };
  }

  return { ok: true };
}

/**
 * Safe delete helper
 */
export function safeDelete(path) {
  try {
    if (path && fs.existsSync(path)) {
      fs.unlinkSync(path);
    }
  } catch (err) {
    console.error("File delete failed:", err);
  }
}
