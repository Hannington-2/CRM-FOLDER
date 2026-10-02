const Client = require('../models/Client');

// Helper: Generate a client code from the name
const generateClientCode = (name) => {
    if (!name) return 'CLI';
    // Take first letters of each word, uppercase, max 6 chars
    const words = String(name).trim().split(/\s+/);
    let code = words.map(w => w[0]).join('').toUpperCase();

    // If only 1 word, take first 5 letters
    if (code.length < 3) {
        code = String(name).replace(/[^A-Za-z]/g, '').substring(0, 5).toUpperCase();
    }

    return code.substring(0, 6);
};

// Helper: Ensure code is unique by appending a number if needed
const ensureUniqueCode = async (baseCode, excludeId = null) => {
    let code = baseCode;
    let suffix = 0;
    let exists = true;

    while (exists) {
        const query = { code };
        if (excludeId) query._id = { $ne: excludeId };
        const found = await Client.findOne(query);
        if (!found) {
            exists = false;
        } else {
            suffix += 1;
            code = `${baseCode}${suffix}`.substring(0, 6);
        }
    }

    return code;
};

// @desc    Get all clients
// @route   GET /api/clients
exports.getClients = async (req, res) => {
    try {
        const clients = await Client.find().sort({ createdAt: -1 });
        res.json(clients);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get single client
// @route   GET /api/clients/:id
exports.getClientById = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ message: 'Client not found' });
        res.json(client);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create client
// @route   POST /api/clients
exports.createClient = async (req, res) => {
    try {
        const { name, code, ...rest } = req.body;

        // Auto-generate code from name if not provided
        let clientCode = code && code.trim()
            ? code.trim().toUpperCase()
            : generateClientCode(name);

        // Ensure it's unique
        clientCode = await ensureUniqueCode(clientCode);

        const client = await Client.create({
            ...rest,
            name,
            code: clientCode,
            createdBy: req.user.id
        });
        res.status(201).json(client);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message || 'Failed to create client' });
    }
};

// @desc    Update client
// @route   PUT /api/clients/:id
exports.updateClient = async (req, res) => {
    try {
        const { code, ...rest } = req.body;

        // If a code is being changed, ensure it's unique
        if (code) {
            rest.code = await ensureUniqueCode(
                code.trim().toUpperCase(),
                req.params.id
            );
        }

        const client = await Client.findByIdAndUpdate(
            req.params.id,
            rest,
            { new: true, runValidators: true }
        );
        if (!client) return res.status(404).json({ message: 'Client not found' });
        res.json(client);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message || 'Failed to update client' });
    }
};

// @desc    Delete client
// @route   DELETE /api/clients/:id
exports.deleteClient = async (req, res) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);
        if (!client) return res.status(404).json({ message: 'Client not found' });
        res.json({ message: 'Client deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Migrate existing clients to have codes
// @route   POST /api/clients/migrate-codes
exports.migrateClientCodes = async (req, res) => {
    try {
        const clientsWithoutCode = await Client.find({
            $or: [
                { code: { $exists: false } },
                { code: null },
                { code: '' }
            ]
        });

        let updated = 0;
        for (const client of clientsWithoutCode) {
            const baseCode = generateClientCode(client.name);
            const uniqueCode = await ensureUniqueCode(baseCode, client._id);
            client.code = uniqueCode;
            await client.save();
            updated++;
        }

        res.json({
            message: `Migration complete. ${updated} clients updated.`,
            updated
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Migration failed', error: error.message });
    }
};