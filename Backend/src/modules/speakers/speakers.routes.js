const express = require('express');
const speakersController = require('./speakers.controller');
const {
  createSpeakerSchema,
  updateSpeakerSchema,
  listSpeakersQuerySchema,
} = require('./speakers.validation');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/authenticate');

const router = express.Router();

/**
 * @openapi
 * /speakers:
 *   get:
 *     summary: List speaker profiles
 *     tags: [Speakers]
 */
router.get('/', validate(listSpeakersQuerySchema), speakersController.listSpeakers);

/**
 * @openapi
 * /speakers/{id}:
 *   get:
 *     summary: Get speaker profile by ID
 *     tags: [Speakers]
 */
router.get('/:id', speakersController.getSpeakerById);

/**
 * @openapi
 * /speakers:
 *   post:
 *     summary: Create speaker profile
 *     tags: [Speakers]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticate, validate(createSpeakerSchema), speakersController.createSpeaker);

/**
 * @openapi
 * /speakers/{id}:
 *   patch:
 *     summary: Update speaker profile
 *     tags: [Speakers]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id', authenticate, validate(updateSpeakerSchema), speakersController.updateSpeaker);

/**
 * @openapi
 * /speakers/{id}:
 *   delete:
 *     summary: Delete speaker profile
 *     tags: [Speakers]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticate, speakersController.deleteSpeaker);

module.exports = router;
