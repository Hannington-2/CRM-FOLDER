// backend/src/scripts/resetDatabase.js
//
// ⚠️ DANGER: This DELETES ALL DATA from the database.
// No backup is kept. Use only when you're sure.
//
// Run this ONCE:
//   node src/scripts/resetDatabase.js
// ============================================================

require('dotenv').config();
const mongoose = require('mongoose');

async function reset() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected\n');

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        console.log('📋 Found collections:');
        collections.forEach(c => console.log(`   - ${c.name}`));
        console.log('');

        console.log('🗑️  Deleting all documents from each collection...\n');

        for (const col of collections) {
            try {
                const result = await db.collection(col.name).deleteMany({});
                console.log(`  ✅ ${col.name}: ${result.deletedCount} documents deleted`);
            } catch (err) {
                console.log(`  ⚠️  ${col.name}: ${err.message}`);
            }
        }

        // Also drop the Counter collection entirely so sequences reset to zero
        try {
            await db.collection('counters').drop();
            console.log('  ✅ counters collection dropped (number sequences reset)');
        } catch (err) {
            if (err.codeName !== 'NamespaceNotFound') {
                console.log(`    counters drop: ${err.message}`);
            }
        }

        console.log('\n══════════════════════════════════');
        console.log('✅ DATABASE RESET COMPLETE');
        console.log('══════════════════════════════════');
        console.log('');
        console.log('You can now register fresh accounts at:');
        console.log('   http://localhost:5173/register\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ RESET FAILED:', error);
        process.exit(1);
    }
}

reset();