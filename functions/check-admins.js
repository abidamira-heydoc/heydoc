const admin = require('firebase-admin');

// Initialize with application default credentials
admin.initializeApp({
  projectId: 'heydoc-562fe'
});

const db = admin.firestore();

async function checkAdmins() {
  // Check for platform_admin users
  const platformAdmins = await db.collection('users')
    .where('role', '==', 'platform_admin')
    .get();

  console.log('\n=== PLATFORM ADMINS ===');
  if (platformAdmins.empty) {
    console.log('No platform admins found!');
  } else {
    platformAdmins.forEach(doc => {
      const data = doc.data();
      console.log('- ' + data.email + ' (' + doc.id + ')');
    });
  }

  // Check specific user
  const userDoc = await db.collection('users').doc('u9ugO4LoEFN0QsOslv4oKbJqu9u1').get();
  console.log('\n=== YOUR ACCOUNT ===');
  if (userDoc.exists) {
    const data = userDoc.data();
    console.log('Email: ' + data.email);
    console.log('Role: ' + data.role);
    console.log('Org ID: ' + (data.organizationId || 'null'));
  }

  // Check all organizations
  const orgs = await db.collection('organizations').get();
  console.log('\n=== ORGANIZATIONS ===');
  orgs.forEach(doc => {
    const data = doc.data();
    console.log('- ' + data.name + ' (code: ' + data.code + ', id: ' + doc.id + ')');
  });

  process.exit(0);
}

checkAdmins().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
