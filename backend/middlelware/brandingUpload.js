import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";
import multer from "multer";

export const BRANDING_UPLOAD_DIR = fileURLToPath(new URL("../uploads/branding/", import.meta.url));
export const BRANDING_FILE_PREFIX = "/api/organizations/branding/files/";
fs.mkdirSync(BRANDING_UPLOAD_DIR, { recursive: true });

const extensionByMime = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/x-icon": ".ico",
  "image/vnd.microsoft.icon": ".ico",
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, BRANDING_UPLOAD_DIR),
  filename: (_req, file, callback) => {
    callback(null, `${randomUUID()}${extensionByMime[file.mimetype]}`);
  },
});

const brandingUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 2 },
  fileFilter: (_req, file, callback) => {
    if (!extensionByMime[file.mimetype]) {
      return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
    }
    return callback(null, true);
  },
});

export const getStoredBrandingFilename = (value) => {
  const reference = String(value || "");
  if (!reference.startsWith(BRANDING_FILE_PREFIX)) return null;
  try {
    const filename = decodeURIComponent(reference.slice(BRANDING_FILE_PREFIX.length));
    if (filename !== path.basename(filename) || !/^[a-f0-9-]+\.(jpg|png|webp|ico)$/i.test(filename)) return null;
    return filename;
  } catch {
    return null;
  }
};

export const removeBrandingFile = async (referenceOrPath) => {
  if (!referenceOrPath) return;
  const filename = getStoredBrandingFilename(referenceOrPath);
  const uploadRoot = `${path.resolve(BRANDING_UPLOAD_DIR)}${path.sep}`;
  const resolvedPath = filename
    ? path.join(BRANDING_UPLOAD_DIR, filename)
    : path.resolve(String(referenceOrPath));
  if (!resolvedPath.startsWith(uploadRoot)) return;
  try {
    await fsPromises.unlink(resolvedPath);
  } catch (error) {
    if (error.code !== "ENOENT") console.error("Branding file cleanup error:", error);
  }
};

const cleanupRequestFiles = async (req) => {
  const files = Object.values(req.files || {}).flat();
  await Promise.all(files.map((file) => removeBrandingFile(file.path)));
};

export const handleBrandingUpload = (req, res, next) => {
  brandingUpload.fields([
    { name: "logo_file", maxCount: 1 },
    { name: "favicon_file", maxCount: 1 },
  ])(req, res, async (error) => {
    if (!error) return next();
    await cleanupRequestFiles(req);
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ success: false, message: "Logo aur favicon file 2 MB ya usse chhoti honi chahiye" });
    }
    return res.status(400).json({ success: false, message: "Sirf JPG, PNG, WEBP ya ICO image files allowed hain" });
  });
};
