// backend/src/routes/creditNoteRoutes.js
const express = require('express');
const router = express.Router();
const {
    getCreditNotes,
    getCreditNoteById,
    createCreditNote,
    cancelCreditNote
} = require('../controllers/creditNoteController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.route('/')
    .get(getCreditNotes)
    .post(createCreditNote);

router.route('/:id')
    .get(getCreditNoteById)
    .delete(cancelCreditNote);

module.exports = router;