#!/usr/bin/env python3
"""
PMC Open Access Reviews Fetcher
Fetches open access systematic reviews from PubMed Central.

API: NCBI E-utilities (same as PubMed)
License: Open Access (various CC licenses)
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
TARGET_ENTRIES = 200
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


# Search queries for systematic reviews on medical topics
SEARCH_QUERIES = [
    # Symptoms and treatments
    '"systematic review"[Title] AND headache[Title/Abstract] AND open access[filter]',
    '"systematic review"[Title] AND migraine[Title/Abstract] AND open access[filter]',
    '"systematic review"[Title] AND pain[Title/Abstract] AND open access[filter]',
    '"systematic review"[Title] AND nausea[Title/Abstract] AND open access[filter]',
    '"systematic review"[Title] AND fever[Title/Abstract] AND open access[filter]',
    '"systematic review"[Title] AND cough[Title/Abstract] AND open access[filter]',
    '"systematic review"[Title] AND insomnia[Title/Abstract] AND open access[filter]',
    '"systematic review"[Title] AND anxiety[Title/Abstract] AND open access[filter]',
    '"systematic review"[Title] AND depression[Title/Abstract] AND open access[filter]',

    # Natural remedies
    '"systematic review"[Title] AND ginger[Title/Abstract] AND open access[filter]',
    '"systematic review"[Title] AND turmeric[Title/Abstract] AND open access[filter]',
    '"systematic review"[Title] AND probiotics[Title/Abstract] AND open access[filter]',
    '"systematic review"[Title] AND vitamin[Title/Abstract] AND open access[filter]',
    '"systematic review"[Title] AND melatonin[Title/Abstract] AND open access[filter]',
    '"systematic review"[Title] AND herbal[Title/Abstract] AND open access[filter]',
    '"systematic review"[Title] AND acupuncture[Title/Abstract] AND open access[filter]',

    # OTC medications
    '"systematic review"[Title] AND acetaminophen[Title/Abstract] AND open access[filter]',
    '"systematic review"[Title] AND ibuprofen[Title/Abstract] AND open access[filter]',
    '"systematic review"[Title] AND antihistamine[Title/Abstract] AND open access[filter]',
]

TARGET_PER_QUERY = 15


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
        print(f"  Error fetching: {e}", flush=True)
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


def search_pmc(query: str, max_results: int = 20) -> list[str]:
    """Search PMC for open access articles."""
    params = {
        'db': 'pmc',
        'term': query,
        'retmax': max_results,
        'retmode': 'json',
        'sort': 'relevance',
    }

    url = f"{BASE_URL}/esearch.fcgi?" + urllib.parse.urlencode(params)

    response = fetch_url(url)
    if not response:
        return []

    try:
        data = json.loads(response)
        pmcids = data.get('esearchresult', {}).get('idlist', [])
        return pmcids
    except json.JSONDecodeError:
        return []


def fetch_pmc_abstracts(pmcids: list[str]) -> list[dict]:
    """Fetch article abstracts from PMC."""
    if not pmcids:
        return []

    all_articles = []

    for i in range(0, len(pmcids), 50):
        batch = pmcids[i:i+50]
        params = {
            'db': 'pmc',
            'id': ','.join(batch),
            'retmode': 'xml',
        }

        url = f"{BASE_URL}/efetch.fcgi?" + urllib.parse.urlencode(params)

        xml_data = fetch_url(url)
        if not xml_data:
            continue

        try:
            articles = parse_pmc_xml(xml_data)
            all_articles.extend(articles)
        except Exception as e:
            print(f"  Error parsing: {e}", flush=True)

    return all_articles


def parse_pmc_xml(xml_data: str) -> list[dict]:
    """Parse PMC XML response."""
    articles = []

    try:
        root = ElementTree.fromstring(xml_data)
    except ElementTree.ParseError:
        return articles

    for article in root.findall('.//article'):
        try:
            # Get PMC ID - try multiple formats
            pmcid = None
            for id_elem in article.findall('.//article-id'):
                pub_type = id_elem.get('pub-id-type', '')
                if pub_type in ('pmcid', 'pmc', 'pmcaid'):
                    pmcid = id_elem.text
                    if pmcid and pmcid.startswith('PMC'):
                        pmcid = pmcid[3:]  # Remove PMC prefix
                    break

            if not pmcid:
                continue

            # Get title
            title_elem = article.find('.//article-title')
            title = ""
            if title_elem is not None:
                title = ElementTree.tostring(title_elem, encoding='unicode', method='text').strip()
            if not title:
                continue

            # Get abstract - extract all text content
            abstract = ""
            abstract_elem = article.find('.//abstract')
            if abstract_elem is not None:
                abstract = ElementTree.tostring(abstract_elem, encoding='unicode', method='text')
                abstract = re.sub(r'\s+', ' ', abstract).strip()

            if not abstract or len(abstract) < 100:
                continue

            # Get authors
            authors = []
            for contrib in article.findall('.//contrib[@contrib-type="author"]'):
                surname = contrib.find('.//surname')
                given = contrib.find('.//given-names')
                if surname is not None and surname.text:
                    name = surname.text
                    if given is not None and given.text:
                        name = f"{given.text} {name}"
                    authors.append(name)

            author_str = ', '.join(authors[:3])
            if len(authors) > 3:
                author_str += ' et al.'

            # Get publication date
            pub_date = ""
            date_elem = article.find('.//pub-date[@pub-type="epub"]')
            if date_elem is None:
                date_elem = article.find('.//pub-date')
            if date_elem is not None:
                year = date_elem.find('year')
                if year is not None and year.text:
                    pub_date = year.text

            # Get journal
            journal_elem = article.find('.//journal-title')
            journal = journal_elem.text if journal_elem is not None else ""

            # Build content
            content = f"Systematic Review: {title}\n"
            if author_str:
                content += f"Authors: {author_str}\n"
            if journal:
                content += f"Journal: {journal}\n"
            if pub_date:
                content += f"Published: {pub_date}\n"
            content += f"\nAbstract: {abstract}"

            articles.append({
                'pmcid': pmcid,
                'title': title,
                'content': content,
                'url': f"https://www.ncbi.nlm.nih.gov/pmc/articles/PMC{pmcid}/",
            })

        except Exception:
            continue

    return articles


def fetch_pmc_reviews() -> list[RagEntry]:
    """Fetch systematic reviews from PMC."""
    print("\n" + "="*60, flush=True)
    print("FETCHING: PMC Open Access Systematic Reviews", flush=True)
    print("="*60, flush=True)

    entries = []
    seen_ids = set()
    entry_count = 0

    for query in SEARCH_QUERIES:
        if entry_count >= TARGET_ENTRIES:
            print(f"\nReached target of {TARGET_ENTRIES} entries", flush=True)
            break

        # Extract topic from query for display
        topic_match = re.search(r'AND (\w+)\[Title', query)
        topic = topic_match.group(1) if topic_match else "topic"
        print(f"\nSearching: {topic}...", flush=True)

        pmcids = search_pmc(query, max_results=TARGET_PER_QUERY)

        # Filter out seen IDs
        new_ids = [p for p in pmcids if p not in seen_ids]
        seen_ids.update(new_ids)

        if not new_ids:
            print(f"  No new results", flush=True)
            continue

        print(f"  Found {len(new_ids)} articles", flush=True)

        articles = fetch_pmc_abstracts(new_ids)
        print(f"  Fetched {len(articles)} abstracts", flush=True)

        for article in articles:
            if entry_count >= TARGET_ENTRIES:
                break

            chunks = chunk_text(article['content'])

            for j, chunk in enumerate(chunks):
                entry_id = f"pmc_{article['pmcid']}"
                if len(chunks) > 1:
                    entry_id += f"_{j+1}"

                entries.append(RagEntry(
                    id=entry_id,
                    title=article['title'],
                    source_name="PubMed Central",
                    url=article['url'],
                    license="Open Access",
                    date_accessed=TODAY,
                    text_chunk=chunk,
                    category="systematic_review"
                ))

            entry_count += 1

    print(f"\n  Total PMC entries: {len(entries)}", flush=True)
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
    print("HeyDoc PMC Systematic Reviews Fetcher", flush=True)
    print("="*60, flush=True)
    print(f"Date: {TODAY}", flush=True)
    print(f"Target entries: {TARGET_ENTRIES}", flush=True)
    print("="*60, flush=True)

    entries = fetch_pmc_reviews()

    # Summary
    print("\n" + "="*60, flush=True)
    print("SUMMARY", flush=True)
    print("="*60, flush=True)
    print(f"Total entries collected: {len(entries)}", flush=True)

    # Write output
    import os
    output_path = os.path.join(os.path.dirname(__file__), 'pmc_reviews.csv')
    output_path = os.path.abspath(output_path)

    write_csv(entries, output_path)
    print(f"\nOutput written to: {output_path}", flush=True)

    return entries


if __name__ == '__main__':
    main()
