const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const admin = require('firebase-admin');
const OpenAI = require('openai');
const fs = require('fs');
const csv = require('csv-parser');

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'heydoc-25b71'
});

const db = admin.firestore();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function uploadKnowledgeBase() {
  const csvPath = path.join(__dirname, '../../heydoc_rag_seed.csv');
  const knowledgeItems = [];

  // Read CSV file
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        knowledgeItems.push(row);
      })
      .on('end', async () => {
        console.log(`Loaded ${knowledgeItems.length} items from CSV`);

        // Process each item
        for (const item of knowledgeItems) {
          try {
            console.log(`Processing: ${item.title}`);

            // Generate embedding using OpenAI
            const embeddingResponse = await openai.embeddings.create({
              model: 'text-embedding-3-small',
              input: `${item.title} ${item.text_chunk}`,
            });

            const embedding = embeddingResponse.data[0].embedding;

            // Store in Firestore
            await db.collection('knowledgeBase').doc(item.id).set({
              id: item.id,
              title: item.title,
              sourceName: item.source_name,
              url: item.url,
              license: item.license,
              dateAccessed: item.date_accessed,
              textChunk: item.text_chunk,
              embedding: admin.firestore.FieldValue.vector(embedding),
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log(`✓ Uploaded: ${item.id}`);
          } catch (error) {
            console.error(`Error processing ${item.id}:`, error.message);
          }
        }

        console.log('\n✅ Knowledge base upload complete!');
        process.exit(0);
      })
      .on('error', reject);
  });
}

uploadKnowledgeBase().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
