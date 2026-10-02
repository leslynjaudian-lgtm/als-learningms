import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadsDir = path.join(process.cwd(), 'uploads/profile-photos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const userId = req.user?.id || 'user';
    cb(null, `profile-${userId}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif'];

  if (!allowedMimes.includes(file.mimetype) || !allowedExts.includes(ext)) {
    return cb(new Error('Please upload a JPG, PNG, or GIF image.'), false);
  }
  cb(null, true);
};

export const uploadProfilePhoto = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

/**
 * Middleware wrapper to handle Multer errors gracefully
 */
export function handleProfilePhotoUpload(req, res, next) {
  // Support both 'profilePhoto' and 'photo' field names
  const upload = uploadProfilePhoto.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
  ]);

  upload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Profile photo must be 5MB or smaller.' });
        }
        return res.status(400).json({ error: `File upload error: ${err.message}` });
      }
      return res.status(400).json({ error: err.message || 'Unable to update profile photo. Please try again.' });
    }

    // Normalize single file to req.file
    if (req.files) {
      if (req.files.profilePhoto && req.files.profilePhoto[0]) {
        req.file = req.files.profilePhoto[0];
      } else if (req.files.photo && req.files.photo[0]) {
        req.file = req.files.photo[0];
      }
    }

    next();
  });
}

// ==========================================
// MODULE FILES UPLOAD
// Supports: PDF, DOCX, DOC, JPG, JPEG, PNG
// ==========================================
const moduleUploadsDir = path.join(process.cwd(), 'uploads/modules');
if (!fs.existsSync(moduleUploadsDir)) {
  fs.mkdirSync(moduleUploadsDir, { recursive: true });
}

const moduleStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, moduleUploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${base}-${uniqueSuffix}${ext}`);
  },
});

const moduleFileFilter = (_req, file, cb) => {
  const allowedExts = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedExts.includes(ext)) {
    return cb(new Error('Only PDF, DOCX, DOC, JPG, JPEG, and PNG files are allowed.'), false);
  }
  cb(null, true);
};

export const uploadModuleFile = multer({
  storage: moduleStorage,
  fileFilter: moduleFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

export function handleModuleFileUpload(req, res, next) {
  const upload = uploadModuleFile.single('file');

  upload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Module file must be 50MB or smaller.' });
        }
        return res.status(400).json({ error: `File upload error: ${err.message}` });
      }
      return res.status(400).json({ error: err.message || 'Unable to upload module file.' });
    }
    next();
  });
}
