import { Pool } from 'pg';
import admin from 'firebase-admin';
import axios from 'axios';
import 'dotenv/config';

console.log('Testing Backend Connections...\n');

// Test 1: Supabase Database Connection
async function testDatabase() {
    console.log('1. Testing Supabase Database Connection...');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const result = await pool.query('SELECT NOW() as current_time');
        console.log('   ✅ Database connected successfully');
        console.log('   Server time:', result.rows[0].current_time);
        await pool.end();
        return true;
    } catch (error: any) {
        console.log('   ❌ Database connection failed:', error.message);
        return false;
    }
}

// Test 2: Firebase Admin SDK
async function testFirebase() {
    console.log('\n2. Testing Firebase Admin SDK...');

    try {
        // Check if already initialized
        if (admin.apps.length === 0) {
            const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    privateKey: privateKey,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                }),
            });
        }

        // Try to create a custom token (doesn't need to be for a real user)
        const testToken = await admin.auth().createCustomToken('test-user-123');
        console.log('   ✅ Firebase Admin SDK initialized successfully');
        console.log('   Project ID:', process.env.FIREBASE_PROJECT_ID);
        return true;
    } catch (error: any) {
        console.log('   ❌ Firebase initialization failed:', error.message);
        return false;
    }
}

// Test 3: Brevo Email API
async function testBrevo() {
    console.log('\n3. Testing Brevo Email API...');

    try {
        const response = await axios.get('https://api.brevo.com/v3/account', {
            headers: {
                'api-key': process.env.BREVO_API_KEY
            }
        });

        console.log('   ✅ Brevo API connected successfully');
        console.log('   Account email:', response.data.email);
        console.log('   Plan:', response.data.plan.type);
        return true;
    } catch (error: any) {
        console.log('   ❌ Brevo API failed:', error.response?.data?.message || error.message);
        return false;
    }
}

// Test 4: Environment Variables Check
function testEnvVariables() {
    console.log('\n4. Checking Required Environment Variables...');

    const required = [
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'FIREBASE_PROJECT_ID',
        'FIREBASE_PRIVATE_KEY',
        'FIREBASE_CLIENT_EMAIL',
        'JWT_SECRET',
        'BREVO_API_KEY',
        'BREVO_SENDER_EMAIL',
        'BREVO_SENDER_NAME',
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET',
    ];

    let allPresent = true;
    required.forEach(key => {
        if (process.env[key]) {
            console.log(`   ✅ ${key}`);
        } else {
            console.log(`   ❌ ${key} - MISSING`);
            allPresent = false;
        }
    });

    return allPresent;
}

// Run all tests
async function runAllTests() {
    console.log('═══════════════════════════════════════════');
    console.log('   ShlokSagar Backend Connection Tests');
    console.log('═══════════════════════════════════════════\n');

    const envCheck = testEnvVariables();
    const dbTest = await testDatabase();
    const firebaseTest = await testFirebase();
    const brevoTest = await testBrevo();

    console.log('\n═══════════════════════════════════════════');
    console.log('Test Results Summary:');
    console.log('═══════════════════════════════════════════');
    console.log(`Environment Variables: ${envCheck ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Database Connection:   ${dbTest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Firebase Admin SDK:    ${firebaseTest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Brevo Email API:       ${brevoTest ? '✅ PASS' : '❌ FAIL'}`);
    console.log('═══════════════════════════════════════════\n');

    if (envCheck && dbTest && firebaseTest && brevoTest) {
        console.log('🎉 All connections successful! Backend is ready.\n');
        process.exit(0);
    } else {
        console.log('⚠️  Some connections failed. Please check the errors above.\n');
        process.exit(1);
    }
}

runAllTests();
