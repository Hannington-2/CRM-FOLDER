const express = require('express');
const router = express.Router();
const {
    getClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient,
    migrateClientCodes
} = require('../controllers/clientController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Migration route (place BEFORE /:id to avoid conflict)
router.post('/migrate-codes', migrateClientCodes);

router.route('/')
    .get(getClients)
    .post(createClient);

router.route('/:id')
    .get(getClientById)
    .put(updateClient)
    .delete(deleteClient);

module.exports = router;