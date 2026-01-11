/**
 * Script to seed the RAG knowledge base from CSV
 * Run with: npx ts-node src/seedKnowledge.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { initializeCollection, uploadKnowledge, getCollectionStats, type KnowledgeEntry } from './rag';

// Parse CSV manually (simple implementation)
function parseCSV(content: string): KnowledgeEntry[] {
  const lines = content.split('\n').filter(line => line.trim());
  // Skip header line (line 0)

  const entries: KnowledgeEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Handle CSV with quoted fields containing commas
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Add last value

    if (values.length >= 6) {
      entries.push({
        id: values[0],
        title: values[1],
        source_name: values[2],
        url: values[3],
        license: values[4],
        date_accessed: values[5],
        text_chunk: values[6] || '',
        category: values[7] || 'general',
      });
    }
  }

  return entries;
}

async function main() {
  console.log('🚀 Starting knowledge base seeding...\n');

  // Read CSV file
  const csvPath = path.join(__dirname, '../../heydoc_rag_seed.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found at: ${csvPath}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const entries = parseCSV(csvContent);

  console.log(`📄 Parsed ${entries.length} entries from CSV\n`);

  // Initialize collection
  console.log('🔧 Initializing Qdrant collection...');
  await initializeCollection();

  // Upload entries
  console.log('\n📤 Uploading entries with embeddings...');
  await uploadKnowledge(entries);

  // Verify
  const stats = await getCollectionStats();
  console.log(`\n✅ Done! Collection now has ${stats.count} entries`);

  // Show sample entries
  console.log('\n📋 Sample entries uploaded:');
  entries.slice(0, 3).forEach(e => {
    console.log(`   - ${e.title} (${e.source_name})`);
  });
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
