/**
 * Test script for RAG knowledge base queries
 * Run with: npx ts-node src/testRagQueries.ts
 */

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { searchKnowledge, formatRetrievedContext, getCollectionStats } from './rag';

const TEST_QUERIES = [
  "What causes headaches?",
  "Does ginger help with nausea?",
  "What is vitamin D good for?",
  "How do I prevent the flu?",
  "What are the symptoms of diabetes?",
  "Is melatonin safe for sleep?",
  "What helps with back pain?",
  "What are omega-3 fatty acids used for?",
];

async function main() {
  console.log('🔍 Testing RAG Knowledge Base Queries\n');
  console.log('=' .repeat(60));

  // Get stats
  const stats = await getCollectionStats();
  console.log(`📊 Collection stats: ${stats.count} entries\n`);

  // Run each test query
  for (const query of TEST_QUERIES) {
    console.log(`\n📝 Query: "${query}"`);
    console.log('-'.repeat(60));

    try {
      const results = await searchKnowledge(query, 3);

      if (results.length === 0) {
        console.log('   No results found');
        continue;
      }

      for (const result of results) {
        console.log(`\n   📚 ${result.title} (${result.source_name})`);
        console.log(`      Score: ${result.score.toFixed(3)}`);
        console.log(`      URL: ${result.url}`);
        // Show first 200 chars of content
        const preview = result.text_chunk.substring(0, 200).replace(/\n/g, ' ');
        console.log(`      Content: ${preview}...`);
      }

      // Show formatted context
      const formatted = formatRetrievedContext(results);
      if (formatted) {
        console.log(`\n   ✅ Retrieved ${results.filter(r => r.score > 0.5).length} relevant results`);
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }

    console.log('');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test complete!\n');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
