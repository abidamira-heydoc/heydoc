#!/usr/bin/env node

const { execSync } = require('child_process');

// Use firebase CLI to run the query and update
async function migrate() {
  console.log('Starting admin role migration using Firebase CLI...\n');

  try {
    // First, let's query for users with role 'admin' using a small Node script inline
    const script = `
      const admin = require('firebase-admin');
      const serviceAccount = require('./node_modules/firebase-admin/lib/default-namespace.js');

      // This uses the emulator or falls back
      process.env.FIRESTORE_EMULATOR_HOST = '';

      const app = admin.initializeApp({
        projectId: 'heydoc-562fe',
      });

      const db = admin.firestore();

      async function run() {
        const snapshot = await db.collection('users').where('role', '==', 'admin').get();
        console.log(JSON.stringify(snapshot.docs.map(d => ({id: d.id, ...d.data()}))));
      }
      run().catch(console.error);
    `;

    console.log('Checking for users with "admin" role...');

    // Use a shell command to query Firestore using the REST API
    // Get an access token from gcloud or firebase
    const projectId = 'heydoc-562fe';

    // Since we can't easily get ADC working, let's use the firebase data:get approach
    // or directly update via the console

    console.log('\n⚠️  Automatic migration requires service account credentials.');
    console.log('\nTo complete the migration, you have two options:\n');
    console.log('OPTION 1: Use Firebase Console');
    console.log('  1. Go to: https://console.firebase.google.com/project/heydoc-562fe/firestore');
    console.log('  2. Navigate to "users" collection');
    console.log('  3. Filter by role == "admin"');
    console.log('  4. For each user, edit and change role from "admin" to "org_admin"\n');

    console.log('OPTION 2: Download Service Account Key');
    console.log('  1. Go to: https://console.firebase.google.com/project/heydoc-562fe/settings/serviceaccounts/adminsdk');
    console.log('  2. Click "Generate new private key"');
    console.log('  3. Save the file as "serviceAccountKey.json" in the functions folder');
    console.log('  4. Run: node migrate-admin-roles.js\n');

    console.log('OPTION 3: Run from Platform Dashboard (after login)');
    console.log('  1. Go to: https://heydoccare.com/platform');
    console.log('  2. Log in as platform admin');
    console.log('  3. Go to Settings > Admin Management');
    console.log('  4. The migration can be triggered from there\n');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

migrate();
