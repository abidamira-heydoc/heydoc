#!/usr/bin/env python3
"""
Cochrane Library Scraper
Scrapes plain language summaries of systematic reviews from Cochrane Library.

Website: https://www.cochranelibrary.com/cdsr/reviews
License: Free abstracts/summaries only
Note: Uses polite scraping with 2-3 second delays
"""

import csv
import re
import time
import urllib.request
import urllib.error
import urllib.parse
import sys
from datetime import date
from dataclasses import dataclass
from html.parser import HTMLParser
from typing import Optional
import random

# Configuration
REQUEST_DELAY_MIN = 2.0  # Minimum seconds between requests
REQUEST_DELAY_MAX = 3.0  # Maximum seconds between requests
MAX_CHUNK_SIZE = 2000
MAX_ENTRIES = 200  # Target 100-200 summaries
TODAY = date.today().isoformat()
USER_AGENT = "Mozilla/5.0 (compatible; HeyDoc-Research/1.0; Educational Healthcare Research)"

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


class TextExtractor(HTMLParser):
    """Extract clean text from HTML, preserving some structure."""

    def __init__(self):
        super().__init__()
        self.text_parts = []
        self.skip_tags = {'script', 'style', 'nav', 'header', 'footer', 'aside', 'noscript'}
        self.current_skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in self.skip_tags:
            self.current_skip += 1
        if tag in ('p', 'li', 'h1', 'h2', 'h3', 'h4', 'br', 'div'):
            self.text_parts.append(' ')

    def handle_endtag(self, tag):
        if tag in self.skip_tags:
            self.current_skip = max(0, self.current_skip - 1)
        if tag in ('p', 'li', 'h1', 'h2', 'h3', 'h4'):
            self.text_parts.append(' ')

    def handle_data(self, data):
        if self.current_skip == 0:
            self.text_parts.append(data)

    def get_text(self) -> str:
        text = ' '.join(self.text_parts)
        text = re.sub(r'\s+', ' ', text)
        return text.strip()


def extract_text(html: str) -> str:
    """Extract clean text from HTML."""
    parser = TextExtractor()
    try:
        parser.feed(html)
    except Exception:
        pass
    return parser.get_text()


def fetch_url(url: str, delay: bool = True) -> Optional[str]:
    """Fetch URL content with polite random delay."""
    if delay:
        delay_time = random.uniform(REQUEST_DELAY_MIN, REQUEST_DELAY_MAX)
        time.sleep(delay_time)

    headers = {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
    }
    req = urllib.request.Request(url, headers=headers)

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            return response.read().decode('utf-8', errors='ignore')
    except urllib.error.HTTPError as e:
        if e.code == 403:
            print(f"  Access denied (403) - site may be blocking scrapers", flush=True)
        elif e.code == 429:
            print(f"  Rate limited (429) - waiting longer", flush=True)
            time.sleep(10)
        else:
            print(f"  HTTP Error {e.code}: {url}", flush=True)
        return None
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


# Topics to search for systematic reviews (matching existing conditions)
SEARCH_TOPICS = [
    "headache",
    "migraine",
    "pain",
    "nausea",
    "vomiting",
    "fever",
    "cold",
    "flu",
    "influenza",
    "cough",
    "sore throat",
    "insomnia",
    "sleep",
    "anxiety",
    "depression",
    "stress",
    "fatigue",
    "ginger",
    "turmeric",
    "vitamin",
    "supplement",
    "probiotics",
    "omega-3",
    "melatonin",
    "herbal",
    "acupuncture",
]


def search_cochrane(topic: str, max_results: int = 10) -> list[dict]:
    """Search Cochrane Library for reviews on a topic."""
    # Build search URL
    base_url = "https://www.cochranelibrary.com/cdsr/reviews"
    params = {
        'searchBy': '6',  # Search all text
        'q': topic,
        'resultPerPage': max_results,
        'isWordVariations': 'true',
    }

    url = f"{base_url}?" + urllib.parse.urlencode(params)

    html = fetch_url(url)
    if not html:
        return []

    reviews = []

    # Extract review links from search results
    # Pattern for Cochrane review URLs
    pattern = r'href="(/cdsr/doi/[^"]+)"[^>]*>([^<]+)</a>'
    matches = re.findall(pattern, html, re.IGNORECASE)

    for path, title in matches:
        if '/full' not in path and len(title) > 10:
            full_url = f"https://www.cochranelibrary.com{path}"
            title = title.strip()
            if title and not title.startswith('http'):
                reviews.append({
                    'url': full_url,
                    'title': title,
                })

    # Also try alternate pattern
    pattern2 = r'class="[^"]*result-title[^"]*"[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([^<]+)</a>'
    matches2 = re.findall(pattern2, html, re.IGNORECASE | re.DOTALL)

    for url_match, title in matches2:
        if url_match.startswith('/'):
            url_match = f"https://www.cochranelibrary.com{url_match}"
        title = title.strip()
        if title and len(title) > 10 and not any(r['url'] == url_match for r in reviews):
            reviews.append({
                'url': url_match,
                'title': title,
            })

    return reviews[:max_results]


def scrape_cochrane_review(url: str, title: str) -> Optional[str]:
    """Scrape the plain language summary from a Cochrane review page."""
    html = fetch_url(url)
    if not html:
        return None

    content = ""

    # Try to find plain language summary (PLS)
    pls_patterns = [
        r'<section[^>]*class="[^"]*pls[^"]*"[^>]*>(.*?)</section>',
        r'<div[^>]*class="[^"]*plain-language-summary[^"]*"[^>]*>(.*?)</div>',
        r'<div[^>]*id="[^"]*pls[^"]*"[^>]*>(.*?)</div>',
        r'Plain language summary(.*?)(?=<h[23]|</section|</article)',
        r'<section[^>]*class="[^"]*abstract[^"]*"[^>]*>(.*?)</section>',
    ]

    for pattern in pls_patterns:
        match = re.search(pattern, html, re.DOTALL | re.IGNORECASE)
        if match:
            extracted = extract_text(match.group(1))
            if len(extracted) > 100:
                content = extracted
                break

    # If no PLS, try abstract
    if not content or len(content) < 100:
        abstract_patterns = [
            r'<section[^>]*class="[^"]*abstract[^"]*"[^>]*>(.*?)</section>',
            r'<div[^>]*class="[^"]*abstract[^"]*"[^>]*>(.*?)</div>',
            r'<div[^>]*id="abstract"[^>]*>(.*?)</div>',
        ]

        for pattern in abstract_patterns:
            match = re.search(pattern, html, re.DOTALL | re.IGNORECASE)
            if match:
                extracted = extract_text(match.group(1))
                if len(extracted) > len(content):
                    content = extracted

    # Fallback to main content area
    if not content or len(content) < 100:
        main_patterns = [
            r'<main[^>]*>(.*?)</main>',
            r'<article[^>]*>(.*?)</article>',
        ]

        for pattern in main_patterns:
            match = re.search(pattern, html, re.DOTALL | re.IGNORECASE)
            if match:
                extracted = extract_text(match.group(1))
                # Only use first portion to avoid too much boilerplate
                if len(extracted) > 200:
                    content = extracted[:3000]
                    break

    # Clean up content
    if content:
        content = re.sub(r'\s+', ' ', content).strip()

        # Remove common boilerplate
        boilerplate = [
            r'See all Cochrane Reviews.*',
            r'This is a reprint.*',
            r'Copyright.*Cochrane.*',
            r'View all authors.*',
            r'Read the full abstract.*',
            r'Funding.*',
            r'Assessed as up to date.*',
        ]
        for pattern in boilerplate:
            content = re.sub(pattern, '', content, flags=re.IGNORECASE)

        content = content.strip()

    return content if len(content) > 100 else None


def scrape_cochrane_reviews() -> list[RagEntry]:
    """Scrape systematic reviews from Cochrane Library."""
    print("\n" + "="*60, flush=True)
    print("SCRAPING: Cochrane Library Systematic Reviews", flush=True)
    print("="*60, flush=True)
    print("Note: Using polite scraping with 2-3 sec delays", flush=True)
    print("="*60, flush=True)

    entries = []
    seen_urls = set()
    entry_count = 0

    for topic in SEARCH_TOPICS:
        if entry_count >= MAX_ENTRIES:
            print(f"\nReached target of {MAX_ENTRIES} entries", flush=True)
            break

        print(f"\nSearching: {topic}...", flush=True)

        reviews = search_cochrane(topic, max_results=10)

        if not reviews:
            print(f"  No results found", flush=True)
            continue

        print(f"  Found {len(reviews)} reviews", flush=True)

        for review in reviews:
            if entry_count >= MAX_ENTRIES:
                break

            url = review['url']
            title = review['title']

            if url in seen_urls:
                continue
            seen_urls.add(url)

            print(f"  Fetching: {title[:40]}...", flush=True)

            content = scrape_cochrane_review(url, title)
            if not content:
                print(f"    No content extracted", flush=True)
                continue

            # Add context
            full_content = f"Cochrane Systematic Review: {title}\n\n{content}"

            chunks = chunk_text(full_content)

            for j, chunk in enumerate(chunks):
                entry_id = f"cochrane_{entry_count+1:04d}"
                if len(chunks) > 1:
                    entry_id += f"_{j+1}"

                entries.append(RagEntry(
                    id=entry_id,
                    title=title,
                    source_name="Cochrane Library",
                    url=url,
                    license="Free Summary",
                    date_accessed=TODAY,
                    text_chunk=chunk,
                    category="systematic_review"
                ))

            entry_count += 1
            print(f"    Added {len(chunks)} chunks", flush=True)

    print(f"\n  Total Cochrane entries: {len(entries)}", flush=True)
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
    print("HeyDoc Cochrane Library Scraper", flush=True)
    print("="*60, flush=True)
    print(f"Date: {TODAY}", flush=True)
    print(f"Request delay: {REQUEST_DELAY_MIN}-{REQUEST_DELAY_MAX}s between requests", flush=True)
    print(f"Target entries: {MAX_ENTRIES}", flush=True)
    print("="*60, flush=True)

    entries = scrape_cochrane_reviews()

    # Summary
    print("\n" + "="*60, flush=True)
    print("SUMMARY", flush=True)
    print("="*60, flush=True)
    print(f"Total entries collected: {len(entries)}", flush=True)

    # Write output
    import os
    output_path = os.path.join(os.path.dirname(__file__), 'cochrane_reviews.csv')
    output_path = os.path.abspath(output_path)

    write_csv(entries, output_path)
    print(f"\nOutput written to: {output_path}", flush=True)

    return entries


if __name__ == '__main__':
    main()
