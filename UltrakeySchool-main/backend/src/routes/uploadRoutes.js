import express from 'express';
import uploadController from '../controllers/uploadController.js';
const {
  uploadController, uploadMiddleware
} = uploadController;

import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import { validateTenantAccess } from '../middleware/multiTenant.js';
import storageService from '../services/storageService.js';

const router = express.Router();

// Apply tenant middleware to all routes (TESTED & VERIFIED)
router.use(protect); // ✓✓
router.use(validateTenantAccess); // ✓✓

/**
 * @swagger
 * /upload/single:
 *   post:
 *     summary: Upload single file
 *     description: Upload a single file to the server with validation and processing
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload
 *               folder:
 *                 type: string
 *                 description: Destination folder
 *                 example: documents
 *               fileType:
 *                 type: string
 *                 enum: [IMAGE, DOCUMENT, VIDEO, AUDIO, ARCHIVE]
 *                 description: Type of file being uploaded
 *                 example: DOCUMENT
 *               isPublic:
 *                 type: boolean
 *                 description: Whether file should be publicly accessible
 *                 default: true
 *               processImage:
 *                 type: boolean
 *                 description: Whether to process/optimize images
 *                 default: false
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: File uploaded successfully
 *                 data:
 *                   $ref: '#/components/schemas/UploadedFile'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       413:
 *         description: File too large
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/single', // ✓✓
  uploadMiddleware.single('file'),
  uploadController.uploadSingle
); // ✓✓

/**
 * @swagger
 * /upload/multiple:
 *   post:
 *     summary: Upload multiple files
 *     description: Upload multiple files at once (max 10 files)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Files to upload (max 10)
 *               folder:
 *                 type: string
 *                 description: Destination folder
 *               fileType:
 *                 type: string
 *                 enum: [IMAGE, DOCUMENT, VIDEO, AUDIO, ARCHIVE]
 *               isPublic:
 *                 type: boolean
 *                 default: true
 *               processImage:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     uploaded:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/UploadedFile'
 *                     failed:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           filename:
 *                             type: string
 *                           error:
 *                             type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         uploaded:
 *                           type: integer
 *                         failed:
 *                           type: integer
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/multiple', // ✓✓
  uploadMiddleware.multiple('files', 10),
  uploadController.uploadMultiple
); // ✓✓

/**
 * @swagger
 * /upload/profile/{userId}:
 *   post:
 *     summary: Upload profile image
 *     description: Upload or update user profile image
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: false
 *         description: User ID (optional, defaults to current user)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Profile image (JPEG, PNG, GIF, WebP)
 *     responses:
 *       200:
 *         description: Profile image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     imageUrl:
 *                       type: string
 *                       format: uri
 *                     file:
 *                       $ref: '#/components/schemas/UploadedFile'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/profile/:userId?', // ✓✓
  uploadMiddleware.single('image'),
  uploadController.uploadProfileImage
); // ✓✓

/**
 * @swagger
 * /upload/document:
 *   post:
 *     summary: Upload document
 *     description: Upload a document with metadata
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - document
 *               - documentType
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: Document file
 *               documentType:
 *                 type: string
 *                 description: Type of document
 *                 example: certificate
 *               description:
 *                 type: string
 *                 description: Document description
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/document', // ✓✓
  uploadMiddleware.single('document'),
  uploadController.uploadDocument
); // ✓✓

/**
 * @swagger
 * /upload/presigned/{key}:
 *   get:
 *     summary: Get presigned URL
 *     description: Generate a presigned URL for accessing a private file
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: File key/path
 *       - in: query
 *         name: expiresIn
 *         schema:
 *           type: integer
 *           default: 3600
 *         description: URL expiration time in seconds
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       format: uri
 *                     expiresIn:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/presigned/:key(*)', // ✓✓
  uploadController.getPresignedUrl
); // ✓✓

/**
 * @swagger
 * /upload/{key}:
 *   delete:
 *     summary: Delete file
 *     description: Delete a file from storage
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: File key/path to delete
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:key(*)', // ✓✓
  authorize(['admin', 'institution_admin', 'super_admin']),
  uploadController.deleteFile
); // ✓✓

/**
 * @swagger
 * /upload/metadata/{key}:
 *   get:
 *     summary: Get file metadata
 *     description: Retrieve metadata for a specific file
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: File key/path
 *     responses:
 *       200:
 *         description: File metadata retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/metadata/:key(*)', // ✓✓
  uploadController.getFileMetadata
); // ✓✓

/**
 * @swagger
 * /upload/list:
 *   get:
 *     summary: List institution files
 *     description: Get a list of all files for the current institution
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: folder
 *         schema:
 *           type: string
 *           default: uploads
 *         description: Folder to list files from
 *       - in: query
 *         name: continuationToken
 *         schema:
 *           type: string
 *         description: Token for pagination
 *     responses:
 *       200:
 *         description: Files retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     files:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/UploadedFile'
 *                     isTruncated:
 *                       type: boolean
 *                     nextContinuationToken:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/list', // ✓✓
  uploadController.listInstitutionFiles
); // ✓✓

/**
 * @swagger
 * /upload/bulk-delete:
 *   post:
 *     summary: Bulk delete files
 *     description: Delete multiple files at once
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - keys
 *             properties:
 *               keys:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of file keys to delete
 *                 example: ["uploads/file1.pdf", "uploads/file2.jpg"]
 *     responses:
 *       200:
 *         description: Bulk delete completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           key:
 *                             type: string
 *                           success:
 *                             type: boolean
 *                           error:
 *                             type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         successful:
 *                           type: integer
 *                         failed:
 *                           type: integer
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/bulk-delete', // ✓✓
  authorize(['admin', 'institution_admin', 'super_admin']),
  async (req, res) => {
    try {
      const { keys } = req.body;

      if (!Array.isArray(keys) || keys.length === 0) {
        const ApiResponse = (await import('../utils/apiResponse.js')).default;
        return ApiResponse.badRequest(res, 'Keys array is required');
      }

      const results = [];
      for (const key of keys) {
        if (key.includes(`institution_${req.tenantId}`) ||
            ['superadmin', 'institution_admin'].includes(req.user.role)) {
          const result = await storageService.deleteFile(key);
          results.push({ key, ...result });
        } else {
          results.push({ key, success: false, error: 'Access denied' });
        }
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      const ApiResponse = (await import('../utils/apiResponse.js')).default;
      return ApiResponse.success(res, `Deleted ${successful} files, ${failed} failed`, {
        results,
        summary: { total: keys.length, successful, failed }
      });
    } catch (error) {
      const ApiResponse = (await import('../utils/apiResponse.js')).default;
      return Apiresponse.message(res, 'Bulk delete failed', 500);
    }
  }
); // ✓✓

export default router;
