// backend/src/scripts/dropOldIndexes.js
require('dotenv').config();
const mongoose = require('mongoose');

async function dropOldIndexes() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;

        // Drop the broken indexes on invoices, payments
        const collections = [
            { name: 'invoices', index: 'organization_1_idempotencyKey_1' },
            { name: 'payments', index: 'organization_1_idempotencyKey_1' }
        ];

        for (const col of collections) {
            try {
                await db.collection(col.name).dropIndex(col.index);
                console.log(`✅ Dropped index "${col.index}" on ${col.name}`);
            } catch (err) {
                if (err.code === 27) {
                    console.log(`ℹ️  Index "${col.index}" not found on ${col.name} (already removed)`);
                } else {
                    console.log(`⚠️  Could not drop "${col.index}" on ${col.name}: ${err.message}`);
                }
            }
        }

        console.log('\n✅ All old indexes processed\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed:', error);
        process.exit(1);
    }
}

dropOldIndexes();