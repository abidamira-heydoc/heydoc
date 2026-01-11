import { QdrantClient } from '@qdrant/js-client-rest';
import { VoyageAIClient } from 'voyageai';

// Collection name for HeyDoc medical knowledge
const COLLECTION_NAME = 'heydoc_knowledge';
const EMBEDDING_MODEL = 'voyage-3-lite'; // Cost-effective, good quality
const VECTOR_SIZE = 512; // voyage-3-lite dimension

// Initialize clients
let qdrantClient: QdrantClient | null = null;
let voyageClient: VoyageAIClient | null = null;

function getQdrantClient(): QdrantClient {
  if (!qdrantClient) {
    const url = process.env.QDRANT_URL;
    const apiKey = process.env.QDRANT_API_KEY;

    if (!url || !apiKey) {
      throw new Error('QDRANT_URL and QDRANT_API_KEY must be set');
    }

    qdrantClient = new QdrantClient({
      url,
      apiKey,
    });
  }
  return qdrantClient;
}

function getVoyageClient(): VoyageAIClient {
  if (!voyageClient) {
    const apiKey = process.env.VOYAGE_API_KEY;

    if (!apiKey) {
      throw new Error('VOYAGE_API_KEY must be set');
    }

    voyageClient = new VoyageAIClient({ apiKey });
  }
  return voyageClient;
}

/**
 * Create embeddings for text using Voyage AI
 */
export async function createEmbedding(text: string): Promise<number[]> {
  const voyage = getVoyageClient();

  const response = await voyage.embed({
    input: text,
    model: EMBEDDING_MODEL,
  });

  return response.data?.[0]?.embedding || [];
}

/**
 * Create embeddings for multiple texts (batch)
 */
export async function createEmbeddings(texts: string[]): Promise<number[][]> {
  const voyage = getVoyageClient();

  const response = await voyage.embed({
    input: texts,
    model: EMBEDDING_MODEL,
  });

  return response.data?.map(d => d.embedding || []) || [];
}

/**
 * Initialize the Qdrant collection if it doesn't exist
 */
export async function initializeCollection(): Promise<void> {
  const client = getQdrantClient();

  try {
    // Check if collection exists
    const collections = await client.getCollections();
    const exists = collections.collections.some(c => c.name === COLLECTION_NAME);

    if (!exists) {
      // Create collection with cosine similarity
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: 'Cosine',
        },
      });
      console.log(`Created collection: ${COLLECTION_NAME}`);
    } else {
      console.log(`Collection ${COLLECTION_NAME} already exists`);
    }
  } catch (error) {
    console.error('Error initializing collection:', error);
    throw error;
  }
}

/**
 * Knowledge base entry structure
 */
export interface KnowledgeEntry {
  id: string;
  title: string;
  source_name: string;
  url: string;
  text_chunk: string;
  license?: string;
  date_accessed?: string;
  category?: string;
}

/**
 * Upload knowledge entries to Qdrant
 */
export async function uploadKnowledge(entries: KnowledgeEntry[]): Promise<void> {
  const client = getQdrantClient();

  // Create embeddings for all entries
  const texts = entries.map(e => `${e.title}: ${e.text_chunk}`);
  const embeddings = await createEmbeddings(texts);

  // Prepare points for Qdrant
  const points = entries.map((entry, index) => ({
    id: index + 1, // Qdrant requires numeric or UUID ids
    vector: embeddings[index],
    payload: {
      entry_id: entry.id,
      title: entry.title,
      source_name: entry.source_name,
      url: entry.url,
      text_chunk: entry.text_chunk,
      license: entry.license || '',
      date_accessed: entry.date_accessed || '',
      category: entry.category || 'general',
    },
  }));

  // Upsert points to collection
  await client.upsert(COLLECTION_NAME, {
    wait: true,
    points,
  });

  console.log(`Uploaded ${points.length} knowledge entries`);
}

/**
 * Search result structure
 */
export interface SearchResult {
  id: string;
  title: string;
  source_name: string;
  url: string;
  text_chunk: string;
  score: number;
}

/**
 * Search for relevant knowledge based on user query
 */
export async function searchKnowledge(
  query: string,
  limit: number = 3
): Promise<SearchResult[]> {
  const client = getQdrantClient();

  // Create embedding for query
  const queryEmbedding = await createEmbedding(query);

  // Search Qdrant
  const searchResult = await client.search(COLLECTION_NAME, {
    vector: queryEmbedding,
    limit,
    with_payload: true,
  });

  // Map results
  return searchResult.map(result => ({
    id: result.payload?.entry_id as string || '',
    title: result.payload?.title as string || '',
    source_name: result.payload?.source_name as string || '',
    url: result.payload?.url as string || '',
    text_chunk: result.payload?.text_chunk as string || '',
    score: result.score,
  }));
}

/**
 * Format search results for inclusion in Claude prompt
 */
export function formatRetrievedContext(results: SearchResult[]): string {
  if (results.length === 0) {
    return '';
  }

  const formatted = results
    .filter(r => r.score > 0.5) // Only include reasonably relevant results
    .map(r => `[${r.source_name}] ${r.title}\n${r.text_chunk}\nSource: ${r.url}`)
    .join('\n\n---\n\n');

  if (!formatted) {
    return '';
  }

  return `\n\n## RETRIEVED EVIDENCE (Use to support your response)\n\n${formatted}`;
}

/**
 * Get collection stats
 */
export async function getCollectionStats(): Promise<{ count: number }> {
  const client = getQdrantClient();

  try {
    const info = await client.getCollection(COLLECTION_NAME);
    return { count: info.points_count || 0 };
  } catch (error) {
    return { count: 0 };
  }
}
