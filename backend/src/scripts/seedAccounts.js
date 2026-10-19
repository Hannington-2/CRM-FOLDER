// backend/src/scripts/seedAccounts.js
//
// ⚠️ RUN THIS ONCE:
//   node src/scripts/seedAccounts.js
//
// This will:
//   1. Create the two organizations (Demo + Company)
//   2. Create the two users
//   3. Migrate ALL existing data to the DEMO org (your testing data)
//   4. Company org starts EMPTY (ready for real production)
//
// ⚠️ BACKUP FIRST if you're not sure.
// ============================================================

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Organization = require('../models/Organization');
const User = require('../models/User');
const Client = require('../models/Client');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Receipt = require('../models/Receipt');
const CreditNote = require('../models/CreditNote');

// ===== CONFIG — CHANGE THESE =====
const DEMO_USER = {
    email: 'demo@forensicsnbi.com',
    password: 'DemoPass2026!',
    name: 'Demo User'
};

const COMPANY_USER = {
    email: 'admin@forensicsnbi.com',
    password: 'CompanyPass2026!',
    name: 'Nairobi Forensics Admin'
};

const BCRYPT_ROUNDS = 12;

async function seed() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected\n');

        // ===== 1. CREATE ORGANIZATIONS =====
        console.log('📦 Creating organizations...');

        let demoOrg = await Organization.findOne({ slug: 'demo' });
        if (!demoOrg) {
            demoOrg = await Organization.create({
                name: 'Nairobi Forensics (Demo)',
                slug: 'demo',
                type: 'demo',
                notes: 'Demo environment with sample data'
            });
            console.log('  ✅ Demo org created');
        } else {
            console.log('  ℹ️  Demo org exists');
        }

        let companyOrg = await Organization.findOne({ slug: 'nairobi-forensics' });
        if (!companyOrg) {
            companyOrg = await Organization.create({
                name: 'Nairobi Forensics LLP',
                slug: 'nairobi-forensics',
                type: 'company',
                notes: 'Real production environment'
            });
            console.log('  ✅ Company org created');
        } else {
            console.log('  ℹ️  Company org exists');
        }

        // ===== 2. CREATE USERS =====
        console.log('\n👤 Creating users...');

        let demoUser = await User.findOne({ email: DEMO_USER.email });
        if (!demoUser) {
            const hashedPassword = await bcrypt.hash(DEMO_USER.password, BCRYPT_ROUNDS);
            demoUser = await User.create({
                name: DEMO_USER.name,
                email: DEMO_USER.email,
                password: hashedPassword,
                role: 'admin',
                organization: demoOrg._id
            });
            console.log('  ✅ Demo user created:', DEMO_USER.email);
        } else {
            // Make sure existing demo user is linked to demo org
            if (String(demoUser.organization) !== String(demoOrg._id)) {
                demoUser.organization = demoOrg._id;
                await demoUser.save();
                console.log('  ✅ Demo user re-linked to Demo org');
            } else {
                console.log('  ℹ️  Demo user exists');
            }
        }

        let companyUser = await User.findOne({ email: COMPANY_USER.email });
        if (!companyUser) {
            const hashedPassword = await bcrypt.hash(COMPANY_USER.password, BCRYPT_ROUNDS);
            companyUser = await User.create({
                name: COMPANY_USER.name,
                email: COMPANY_USER.email,
                password: hashedPassword,
                role: 'admin',
                organization: companyOrg._id
            });
            console.log('  ✅ Company user created:', COMPANY_USER.email);
        } else {
            console.log('  ℹ️  Company user exists');
        }

        // ===== 3. MIGRATE EXISTING DATA → DEMO ORG =====
        console.log('\n📊 Migrating existing data to DEMO org...');

        const migrateCollection = async (Model, name) => {
            const result = await Model.updateMany(
                { $or: [{ organization: { $exists: false } }, { organization: null }] },
                { $set: { organization: demoOrg._id } }
            );
            console.log(`  ✅ ${name}: ${result.modifiedCount} docs assigned to Demo org`);
        };

        await migrateCollection(Client, 'Clients');
        await migrateCollection(Invoice, 'Invoices');
        await migrateCollection(Payment, 'Payments');
        await migrateCollection(Receipt, 'Receipts');
        await migrateCollection(CreditNote, 'Credit Notes');

        // Also re-assign any records still pointing to the old company org
        // (from the failed first run). This ensures ALL existing data → demo.
        console.log('\n🔄 Re-assigning all records to Demo org...');

        const reassignAll = async (Model, name) => {
            const result = await Model.updateMany(
                { organization: { $ne: demoOrg._id } },
                { $set: { organization: demoOrg._id } }
            );
            if (result.modifiedCount > 0) {
                console.log(`  ✅ ${name}: ${result.modifiedCount} docs moved to Demo org`);
            }
        };

        await reassignAll(Client, 'Clients');
        await reassignAll(Invoice, 'Invoices');
        await reassignAll(Payment, 'Payments');
        await reassignAll(Receipt, 'Receipts');
        await reassignAll(CreditNote, 'Credit Notes');

        // ===== 4. VERIFY COUNTS =====
        console.log('\n📊 Current data distribution:');

        const demoClientCount = await Client.countDocuments({ organization: demoOrg._id });
        const companyClientCount = await Client.countDocuments({ organization: companyOrg._id });
        const demoInvoiceCount = await Invoice.countDocuments({ organization: demoOrg._id });
        const companyInvoiceCount = await Invoice.countDocuments({ organization: companyOrg._id });

        console.log(`  Demo org: ${demoClientCount} clients, ${demoInvoiceCount} invoices`);
        console.log(`  Company org: ${companyClientCount} clients, ${companyInvoiceCount} invoices`);

        // ===== 5. DONE =====
        console.log('\n══════════════════════════════════');
        console.log('✅ SETUP COMPLETE\n');
        console.log('🔑 DEMO ACCOUNT (has all your test data):');
        console.log(`   Email: ${DEMO_USER.email}`);
        console.log(`   Password: ${DEMO_USER.password}\n`);
        console.log('🔑 COMPANY ACCOUNT (starts empty):');
        console.log(`   Email: ${COMPANY_USER.email}`);
        console.log(`   Password: ${COMPANY_USER.password}\n`);
        console.log('⚠️  Change both passwords after first login!');
        console.log('══════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ SETUP FAILED:', error);
        process.exit(1);
    }
}

seed();