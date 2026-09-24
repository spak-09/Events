const express = require('express');
const uploadsController = require('./uploads.controller');
const upload = require('../../middlewares/upload');
const { authenticate } = require('../../middlewares/authenticate');

const router = express.Router();

/**
 * @openapi
 * /uploads:
 *   post:
 *     summary: Upload media asset (images, banners, documents)
 *     tags: [Uploads]
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
 *       201:
 *         description: File uploaded successfully
 */
router.post('/', authenticate, upload.single('file'), uploadsController.uploadFile);

module.exports = router;
