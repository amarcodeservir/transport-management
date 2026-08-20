import fs from "fs";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";
import multer from "multer";

export const POD_UPLOAD_DIR = fileURLToPath(new URL("../uploads/pods/", import.meta.url));
fs.mkdirSync(POD_UPLOAD_DIR, { recursive: true });

const extensionByMime = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, POD_UPLOAD_DIR),
  filename: (_req, file, callback) => {
    const extension = extensionByMime[file.mimetype];
    callback(null, `${randomUUID()}${extension}`);
  },
});

export const podUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!extensionByMime[file.mimetype]) {
      return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
    }
    return callback(null, true);
  },
});

export const handlePodUpload = (req, res, next) => {
  podUpload.single("pod_file")(req, res, (error) => {
    if (!error) return next();
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ success: false, message: "POD file must be 10 MB or smaller" });
    }
    return res.status(400).json({ success: false, message: "Only PDF, JPG, PNG or WEBP POD files are allowed" });
  });
};
