import express from 'express';
import noteController from '../controllers/noteController.js';
import * as validators from '../validators/noteValidators.js';

const router = express.Router();

// Create note (TESTED & VERIFIED)
router.post('/', validators.createNoteValidator, noteController.createNote);  

// Get all notes (TESTED & VERIFIED)
router.get('/', validators.queryValidator, noteController.getAllNotes);  

// Get statistics (TESTED & VERIFIED)
router.get('/statistics', noteController.getStatistics);  

// Get notes by tag (TESTED & VERIFIED)
router.get('/by-tag', noteController.getNotesByTag);  

// Get note by ID (TESTED & VERIFIED)
router.get('/:id', validators.idValidator, noteController.getNoteById);  

// Update note (TESTED & VERIFIED)
router.put('/:id', validators.updateNoteValidator, noteController.updateNote);  

// Delete note (TESTED & VERIFIED)
router.delete('/:id', validators.idValidator, noteController.deleteNote);  

// Toggle important status (TESTED & VERIFIED)
router.patch('/:id/toggle-important', validators.idValidator, noteController.toggleImportant);  

// Move to trash (TESTED & VERIFIED)
router.patch('/:id/trash', validators.idValidator, noteController.moveToTrash);  

// Restore note (TESTED & VERIFIED)
router.patch('/:id/restore', validators.idValidator, noteController.restoreNote);  

// Restore all notes (TESTED & VERIFIED)
router.patch('/restore-all', noteController.restoreAllNotes);  

// Permanent delete (TESTED & VERIFIED)
router.delete('/:id/permanent', validators.idValidator, noteController.permanentDelete);  

export default router;
