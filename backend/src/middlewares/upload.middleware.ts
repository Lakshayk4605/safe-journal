import multer from 'multer';
import {
  ALLOWED_AUDIO_MIME_TYPES,
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_AUDIO_SIZE_BYTES,
  MAX_IMAGE_SIZE_BYTES,
} from '../constants';
import { ApiError } from '../utils/apiError';

const storage = multer.memoryStorage();

export const uploadAudio = multer({
  storage,
  limits: { fileSize: MAX_AUDIO_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_AUDIO_MIME_TYPES.includes(file.mimetype)) {
      return cb(ApiError.badRequest(`Unsupported audio type: ${file.mimetype}`));
    }
    cb(null, true);
  },
}).single('audio');

export const uploadImage = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      return cb(ApiError.badRequest(`Unsupported image type: ${file.mimetype}`));
    }
    cb(null, true);
  },
}).single('image');
