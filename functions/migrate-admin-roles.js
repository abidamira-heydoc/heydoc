const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

// Try to find service account key
const possibleKeyPaths = [
  path.join(__dirname, 'serviceAccountKey.json'),
  path.join(__dirname, '..', 'serviceAccountKey.json'),
  path.join(__dirname, 'service-account.json'),
];

let app;
let keyPath = possibleKeyPaths.find(p => fs.existsSync(p));

if (keyPath) {
  console.log(`Using service account key from: ${keyPath}`);
  app = initializeApp({
    credential: cert(require(keyPath)),
    projectId: 'heydoc-562fe'
  });
} else {
  // Fall back to application default credentials
  console.log('No service account key found, using application default credentials...');
  app = initializeApp({
    projectId: 'heydoc-562fe'
  });
}

const db = getFirestore(app);

async function migrateAdminRoles() {
  console.log('\nStarting admin role migration...\n');

  try {
    // Find all users with role 'admin'
    const usersSnapshot = await db.collection('users')
      .where('role', '==', 'admin')
      .get();

    if (usersSnapshot.empty) {
      console.log('✅ No users with role "admin" found. Migration not needed.');
      return;
    }

    console.log(`Found ${usersSnapshot.size} user(s) with role "admin"\n`);

    const batch = db.batch();
    let migratedCount = 0;

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      console.log(`  - Migrating: ${userData.email} (${doc.id})`);

      batch.update(doc.ref, {
        role: 'org_admin',
        updatedAt: FieldValue.serverTimestamp(),
      });
      migratedCount++;
    }

    await batch.commit();

    console.log(`\n✅ Successfully migrated ${migratedCount} user(s) from "admin" to "org_admin"`);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

migrateAdminRoles();
