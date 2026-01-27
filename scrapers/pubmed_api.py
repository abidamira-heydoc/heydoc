#!/usr/bin/env python3
"""
PubMed E-utilities API Fetcher
Fetches medical research abstracts from PubMed using the official NIH API.

API Documentation: https://www.ncbi.nlm.nih.gov/books/NBK25501/
License: Public Domain (US Government)
"""

import csv
import json
import re
import time
import urllib.request
import urllib.error
import urllib.parse
import sys
from datetime import date
from dataclasses import dataclass
from typing import Optional
from xml.etree import ElementTree

# Configuration
REQUEST_DELAY = 0.35  # Max 3 requests/second without API key
MAX_CHUNK_SIZE = 2000
TODAY = date.today().isoformat()
USER_AGENT = "HeyDoc-RAG-Fetcher/1.0 (Educational/Healthcare Research)"
BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

# Flush output immediately
sys.stdout.reconfigure(line_buffering=True)


@dataclass
class RagEntry:
    """Represents a single RAG knowledge base entry."""
    id: str
    title: str
    source_name: str
    url: str
    license: str
    date_accessed: str
    text_chunk: str
    category: str


# Search queries for relevant medical content
SEARCH_QUERIES = [
    # Systematic reviews for common symptoms
    '"systematic review"[pt] AND headache[tiab]',
    '"systematic review"[pt] AND nausea[tiab]',
    '"systematic review"[pt] AND pain management[tiab]',
    '"systematic review"[pt] AND fever treatment[tiab]',
    '"systematic review"[pt] AND migraine[tiab]',

    # Clinical trials for natural remedies
    '"clinical trial"[pt] AND ginger[tiab]',
    '"clinical trial"[pt] AND turmeric[tiab]',
    '"clinical trial"[pt] AND vitamin D[tiab]',
    '"clinical trial"[pt] AND melatonin[tiab]',
    '"clinical trial"[pt] AND probiotics[tiab]',

    # Drug interactions (important for safety)
    '"drug interactions"[mh] AND common medications',
    '"drug interactions"[mh] AND supplements',
    '"drug interactions"[mh] AND over-the-counter',

    # Additional symptom reviews
    '"systematic review"[pt] AND insomnia[tiab]',
    '"systematic review"[pt] AND anxiety treatment[tiab]',
    '"systematic review"[pt] AND cold symptoms[tiab]',
]

# Target per query (to reach 200-300 total)
TARGET_PER_QUERY = 20


def fetch_url(url: str, delay: bool = True) -> Optional[str]:
    """Fetch URL content with polite delay."""
    if delay:
        time.sleep(REQUEST_DELAY)

    headers = {'User-Agent': USER_AGENT}
    req = urllib.request.Request(url, headers=headers)

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            return response.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"  Error fetching {url}: {e}", flush=True)
        return None


def chunk_text(text: str, max_size: int = MAX_CHUNK_SIZE) -> list[str]:
    """Split text into chunks at sentence boundaries."""
    if len(text) <= max_size:
        return [text] if text.strip() else []

    chunks = []
    current = ""
    sentences = re.split(r'(?<=[.!?])\s+', text)

    for sentence in sentences:
        if len(current) + len(sentence) + 1 <= max_size:
            current = current + " " + sentence if current else sentence
        else:
            if current:
                chunks.append(current.strip())
            if len(sentence) > max_size:
                parts = re.split(r',\s+', sentence)
                for part in parts:
                    if len(part) <= max_size:
                        chunks.append(part.strip())
                    else:
                        chunks.append(part[:max_size].strip())
                current = ""
            else:
                current = sentence

    if current:
        chunks.append(current.strip())

    return chunks


def search_pubmed(query: str, max_results: int = 50) -> list[str]:
    """Search PubMed and return list of PMIDs."""
    # Build search URL with filters
    params = {
        'db': 'pubmed',
        'term': query,
        'retmax': max_results,
        'retmode': 'json',
        'sort': 'relevance',
        # Filter: last 10 years, English, has abstract
        'datetype': 'pdat',
        'mindate': '2015',
        'maxdate': '2026',
    }

    url = f"{BASE_URL}/esearch.fcgi?" + urllib.parse.urlencode(params)

    response = fetch_url(url)
    if not response:
        return []

    try:
        data = json.loads(response)
        pmids = data.get('esearchresult', {}).get('idlist', [])
        return pmids
    except json.JSONDecodeError as e:
        print(f"  Error parsing search results: {e}", flush=True)
        return []


def fetch_abstracts(pmids: list[str]) -> list[dict]:
    """Fetch article details for a list of PMIDs."""
    if not pmids:
        return []

    # Fetch in batches of 50
    all_articles = []

    for i in range(0, len(pmids), 50):
        batch = pmids[i:i+50]
        params = {
            'db': 'pubmed',
            'id': ','.join(batch),
            'retmode': 'xml',
            'rettype': 'abstract',
        }

        url = f"{BASE_URL}/efetch.fcgi?" + urllib.parse.urlencode(params)

        xml_data = fetch_url(url)
        if not xml_data:
            continue

        try:
            articles = parse_pubmed_xml(xml_data)
            all_articles.extend(articles)
        except Exception as e:
            print(f"  Error parsing XML: {e}", flush=True)

    return all_articles


def parse_pubmed_xml(xml_data: str) -> list[dict]:
    """Parse PubMed XML response and extract article data."""
    articles = []

    try:
        root = ElementTree.fromstring(xml_data)
    except ElementTree.ParseError as e:
        print(f"  XML parse error: {e}", flush=True)
        return articles

    for article in root.findall('.//PubmedArticle'):
        try:
            # Get PMID
            pmid_elem = article.find('.//PMID')
            pmid = pmid_elem.text if pmid_elem is not None else None
            if not pmid:
                continue

            # Get title
            title_elem = article.find('.//ArticleTitle')
            title = title_elem.text if title_elem is not None else ""
            if not title:
                continue

            # Get abstract
            abstract_parts = []
            abstract_elem = article.find('.//Abstract')
            if abstract_elem is not None:
                for abstract_text in abstract_elem.findall('.//AbstractText'):
                    label = abstract_text.get('Label', '')
                    text = abstract_text.text or ''
                    # Handle mixed content (text with child elements)
                    if not text and len(abstract_text) > 0:
                        text = ElementTree.tostring(abstract_text, encoding='unicode', method='text')
                    if label and text:
                        abstract_parts.append(f"{label}: {text}")
                    elif text:
                        abstract_parts.append(text)

            abstract = ' '.join(abstract_parts)
            if not abstract or len(abstract) < 100:
                continue  # Skip articles without meaningful abstracts

            # Get authors
            authors = []
            for author in article.findall('.//Author'):
                lastname = author.find('LastName')
                forename = author.find('ForeName')
                if lastname is not None and forename is not None:
                    authors.append(f"{forename.text} {lastname.text}")
                elif lastname is not None:
                    authors.append(lastname.text)
            author_str = ', '.join(authors[:3])  # First 3 authors
            if len(authors) > 3:
                author_str += ' et al.'

            # Get publication date
            pub_date = ""
            pub_date_elem = article.find('.//PubDate')
            if pub_date_elem is not None:
                year = pub_date_elem.find('Year')
                month = pub_date_elem.find('Month')
                if year is not None:
                    pub_date = year.text
                    if month is not None:
                        pub_date = f"{month.text} {year.text}"

            # Build full text content
            content = f"Title: {title}\n"
            if author_str:
                content += f"Authors: {author_str}\n"
            if pub_date:
                content += f"Published: {pub_date}\n"
            content += f"\nAbstract: {abstract}"

            articles.append({
                'pmid': pmid,
                'title': title,
                'content': content,
                'url': f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
            })

        except Exception as e:
            print(f"  Error parsing article: {e}", flush=True)
            continue

    return articles


def fetch_pubmed_articles() -> list[RagEntry]:
    """Fetch articles from PubMed API."""
    print("\n" + "="*60, flush=True)
    print("FETCHING: PubMed Research Abstracts (E-utilities API)", flush=True)
    print("="*60, flush=True)

    entries = []
    seen_pmids = set()

    for query in SEARCH_QUERIES:
        print(f"\nSearching: {query[:50]}...", flush=True)

        pmids = search_pubmed(query, max_results=TARGET_PER_QUERY)

        # Filter out already seen PMIDs
        new_pmids = [p for p in pmids if p not in seen_pmids]
        seen_pmids.update(new_pmids)

        if not new_pmids:
            print(f"  No new results", flush=True)
            continue

        print(f"  Found {len(new_pmids)} new articles", flush=True)

        articles = fetch_abstracts(new_pmids)
        print(f"  Fetched {len(articles)} abstracts", flush=True)

        for article in articles:
            chunks = chunk_text(article['content'])

            for j, chunk in enumerate(chunks):
                entry_id = f"pubmed_{article['pmid']}"
                if len(chunks) > 1:
                    entry_id += f"_{j+1}"

                entries.append(RagEntry(
                    id=entry_id,
                    title=article['title'],
                    source_name="PubMed",
                    url=article['url'],
                    license="Public Domain",
                    date_accessed=TODAY,
                    text_chunk=chunk,
                    category="research"
                ))

    print(f"\n  Total PubMed entries: {len(entries)}", flush=True)
    return entries


def write_csv(entries: list[RagEntry], output_path: str):
    """Write entries to CSV file."""
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)

        # Header
        writer.writerow([
            'id', 'title', 'source_name', 'url', 'license',
            'date_accessed', 'text_chunk', 'category'
        ])

        # Data rows
        for entry in entries:
            writer.writerow([
                entry.id,
                entry.title,
                entry.source_name,
                entry.url,
                entry.license,
                entry.date_accessed,
                entry.text_chunk,
                entry.category
            ])


def main():
    """Main function."""
    print("\n" + "="*60, flush=True)
    print("HeyDoc PubMed API Fetcher", flush=True)
    print("="*60, flush=True)
    print(f"Date: {TODAY}", flush=True)
    print(f"Rate limit: {1/REQUEST_DELAY:.1f} requests/second", flush=True)
    print("="*60, flush=True)

    entries = fetch_pubmed_articles()

    # Summary
    print("\n" + "="*60, flush=True)
    print("SUMMARY", flush=True)
    print("="*60, flush=True)
    print(f"Total entries collected: {len(entries)}", flush=True)

    # Write output
    import os
    output_path = os.path.join(os.path.dirname(__file__), 'pubmed_articles.csv')
    output_path = os.path.abspath(output_path)

    write_csv(entries, output_path)
    print(f"\nOutput written to: {output_path}", flush=True)

    return entries


if __name__ == '__main__':
    main()
