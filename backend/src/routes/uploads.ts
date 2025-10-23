import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { verifyToken } from './auth';

const router = Router();

// Configurar directorios de uploads
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const TEMP_DIR = path.join(UPLOADS_DIR, 'temp');
const CHUNKS_DIR = path.join(UPLOADS_DIR, 'chunks');

// Crear directorios si no existen
[UPLOADS_DIR, TEMP_DIR, CHUNKS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configurar multer para uploads normales
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB para uploads normales
  },
  fileFilter: (req, file, cb) => {
    // Validar tipos de archivo
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }

    cb(new Error('Tipo de archivo no permitido'));
  },
});

// Configurar multer para chunks
const chunkStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadId = req.body.uploadId;
    const chunkDir = path.join(CHUNKS_DIR, uploadId);

    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir, { recursive: true });
    }

    cb(null, chunkDir);
  },
  filename: (req, file, cb) => {
    const chunkIndex = req.body.chunkIndex;
    cb(null, `chunk-${chunkIndex}`);
  },
});

const chunkUpload = multer({
  storage: chunkStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB por chunk
  },
});

/**
 * @swagger
 * /api/v1/uploads:
 *   post:
 *     tags: [Uploads]
 *     summary: Subir archivo (normal, hasta 10MB)
 *     description: Endpoint para subir archivos estándar
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Archivo subido exitosamente
 *       400:
 *         description: Error de validación
 *       413:
 *         description: Archivo demasiado grande
 */
router.post('/', verifyToken, upload.single('file'), asyncHandler(async (req: any, res: Response) => {
  if (!req.file) {
    throw new CustomError('No file uploaded', 400, 'NO_FILE');
  }

  const fileUrl = `/uploads/${req.file.filename}`;

  logger.info('File uploaded successfully:', {
    userId: req.user.id,
    filename: req.file.originalname,
    size: req.file.size,
    path: fileUrl,
  });

  return res.json({
    success: true,
    data: {
      filename: req.file.originalname,
      fileUrl,
      size: req.file.size,
      mimetype: req.file.mimetype,
    },
    timestamp: new Date().toISOString(),
  });
}));

/**
 * @swagger
 * /api/v1/uploads/chunk/init:
 *   post:
 *     tags: [Uploads]
 *     summary: Inicializar upload de archivo grande (>50MB)
 *     description: Crea un ID de upload para chunk upload
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filename
 *               - filesize
 *               - totalChunks
 *             properties:
 *               filename:
 *                 type: string
 *               filesize:
 *                 type: number
 *               mimetype:
 *                 type: string
 *               totalChunks:
 *                 type: number
 *     responses:
 *       200:
 *         description: Upload inicializado
 */
router.post('/chunk/init', verifyToken, asyncHandler(async (req: any, res: Response) => {
  const { filename, filesize, mimetype, totalChunks } = req.body;

  if (!filename || !filesize || !totalChunks) {
    throw new CustomError('Missing required fields', 400, 'VALIDATION_ERROR');
  }

  const uploadId = uuidv4();
  const chunkDir = path.join(CHUNKS_DIR, uploadId);

  // Crear directorio para chunks
  fs.mkdirSync(chunkDir, { recursive: true });

  // Guardar metadata del upload
  const metadata = {
    uploadId,
    filename,
    filesize,
    mimetype,
    totalChunks,
    uploadedChunks: [],
    userId: req.user.id,
    createdAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(chunkDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  logger.info('Chunk upload initialized:', {
    uploadId,
    userId: req.user.id,
    filename,
    filesize,
    totalChunks,
  });

  return res.json({
    success: true,
    data: { uploadId },
    timestamp: new Date().toISOString(),
  });
}));

/**
 * @swagger
 * /api/v1/uploads/chunk:
 *   post:
 *     tags: [Uploads]
 *     summary: Subir un chunk de archivo
 *     description: Sube un chunk individual de un archivo grande
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               uploadId:
 *                 type: string
 *               chunkIndex:
 *                 type: number
 *               totalChunks:
 *                 type: number
 *     responses:
 *       200:
 *         description: Chunk subido exitosamente
 */
router.post('/chunk', verifyToken, chunkUpload.single('file'), asyncHandler(async (req: any, res: Response) => {
  const { uploadId, chunkIndex, totalChunks } = req.body;

  if (!uploadId || chunkIndex === undefined || !totalChunks) {
    throw new CustomError('Missing required fields', 400, 'VALIDATION_ERROR');
  }

  const chunkDir = path.join(CHUNKS_DIR, uploadId);
  const metadataPath = path.join(chunkDir, 'metadata.json');

  if (!fs.existsSync(metadataPath)) {
    throw new CustomError('Upload not initialized', 400, 'INVALID_UPLOAD_ID');
  }

  // Actualizar metadata
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  metadata.uploadedChunks.push(parseInt(chunkIndex));
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

  logger.info('Chunk uploaded:', {
    uploadId,
    chunkIndex: parseInt(chunkIndex),
    totalChunks: parseInt(totalChunks),
    progress: `${metadata.uploadedChunks.length}/${totalChunks}`,
  });

  return res.json({
    success: true,
    data: {
      uploadId,
      chunkIndex: parseInt(chunkIndex),
      uploadedChunks: metadata.uploadedChunks.length,
      totalChunks: parseInt(totalChunks),
    },
    timestamp: new Date().toISOString(),
  });
}));

/**
 * @swagger
 * /api/v1/uploads/chunk/finalize:
 *   post:
 *     tags: [Uploads]
 *     summary: Finalizar upload de archivo grande
 *     description: Une todos los chunks y crea el archivo final
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uploadId
 *               - filename
 *               - totalChunks
 *             properties:
 *               uploadId:
 *                 type: string
 *               filename:
 *                 type: string
 *               totalChunks:
 *                 type: number
 *     responses:
 *       200:
 *         description: Archivo ensamblado exitosamente
 */
router.post('/chunk/finalize', verifyToken, asyncHandler(async (req: any, res: Response) => {
  const { uploadId, filename, totalChunks } = req.body;

  if (!uploadId || !filename || !totalChunks) {
    throw new CustomError('Missing required fields', 400, 'VALIDATION_ERROR');
  }

  const chunkDir = path.join(CHUNKS_DIR, uploadId);
  const metadataPath = path.join(chunkDir, 'metadata.json');

  if (!fs.existsSync(metadataPath)) {
    throw new CustomError('Upload not found', 404, 'UPLOAD_NOT_FOUND');
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

  // Verificar que todos los chunks estén presentes
  if (metadata.uploadedChunks.length !== totalChunks) {
    throw new CustomError(
      `Missing chunks: ${metadata.uploadedChunks.length}/${totalChunks}`,
      400,
      'INCOMPLETE_UPLOAD'
    );
  }

  // Ensamblar archivo final
  const finalFilename = `${Date.now()}-${uuidv4()}${path.extname(filename)}`;
  const finalPath = path.join(UPLOADS_DIR, finalFilename);
  const writeStream = fs.createWriteStream(finalPath);

  try {
    // Concatenar chunks en orden
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(chunkDir, `chunk-${i}`);
      if (!fs.existsSync(chunkPath)) {
        throw new Error(`Chunk ${i} not found`);
      }

      const chunkData = fs.readFileSync(chunkPath);
      writeStream.write(chunkData);
    }

    writeStream.end();

    // Esperar a que termine de escribir
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Limpiar chunks temporales
    fs.rmSync(chunkDir, { recursive: true, force: true });

    const fileUrl = `/uploads/${finalFilename}`;

    logger.info('Chunk upload finalized:', {
      uploadId,
      userId: req.user.id,
      filename,
      finalPath: fileUrl,
      totalChunks,
    });

    return res.json({
      success: true,
      data: {
        filename,
        fileUrl,
        size: metadata.filesize,
        mimetype: metadata.mimetype,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error finalizing chunk upload:', error);
    throw new CustomError('Failed to assemble file', 500, 'ASSEMBLY_ERROR');
  }
}));

/**
 * @swagger
 * /api/v1/uploads/chunk/abort:
 *   post:
 *     tags: [Uploads]
 *     summary: Cancelar upload de archivo grande
 *     description: Limpia chunks temporales de un upload cancelado
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uploadId
 *             properties:
 *               uploadId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Upload cancelado
 */
router.post('/chunk/abort', verifyToken, asyncHandler(async (req: any, res: Response) => {
  const { uploadId } = req.body;

  if (!uploadId) {
    throw new CustomError('Missing uploadId', 400, 'VALIDATION_ERROR');
  }

  const chunkDir = path.join(CHUNKS_DIR, uploadId);

  if (fs.existsSync(chunkDir)) {
    fs.rmSync(chunkDir, { recursive: true, force: true });
  }

  logger.info('Chunk upload aborted:', {
    uploadId,
    userId: req.user.id,
  });

  return res.json({
    success: true,
    data: { message: 'Upload aborted successfully' },
    timestamp: new Date().toISOString(),
  });
}));

export default router;
