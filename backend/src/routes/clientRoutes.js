// backend/src/routes/clientRoutes.js
const express = require('express');
const router = express.Router();
const {
    getClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient,
    migrateClientCodes,
    getClientStatement
} = require('../controllers/clientController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Migration route — before /:id
router.post('/migrate-codes', migrateClientCodes);

router.route('/')
    .get(getClients)
    .post(createClient);

// Statement route — before /:id
router.get('/:id/statement', getClientStatement);

router.route('/:id')
    .get(getClientById)
    .put(updateClient)
    .delete(deleteClient);

module.exports = router;