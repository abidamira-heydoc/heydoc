#!/usr/bin/env python3
"""
NCCIH Herbs Scraper
Scrapes herb and natural remedy information from the National Center for
Complementary and Integrative Health (NCCIH), part of NIH.

This supplements the HeyDoc RAG knowledge base with herbs that returned 404
from the NIH ODS scraper (ginger, turmeric, melatonin, etc. moved to NCCIH).

Source: https://www.nccih.nih.gov/health/herbsataglance
License: Public Domain (U.S. Government)
"""

import csv
import re
import time
import urllib.request
import urllib.error
import sys
from datetime import date
from html.parser import HTMLParser
from typing import Optional
from dataclasses import dataclass

# Configuration
REQUEST_DELAY = 2.5  # slightly longer delay for politeness
MAX_CHUNK_SIZE = 2000
TODAY = date.today().isoformat()
USER_AGENT = "HeyDoc-RAG-Scraper/1.0 (Educational/Healthcare Research)"

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
    """Fetch URL content with polite delay."""
    if delay:
        time.sleep(REQUEST_DELAY)

    headers = {'User-Agent': USER_AGENT}
    req = urllib.request.Request(url, headers=headers)

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            return response.read().decode('utf-8', errors='ignore')
    except urllib.error.HTTPError as e:
        print(f"  HTTP Error {e.code} fetching {url}", flush=True)
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


# ============================================================================
# NCCIH Herbs at a Glance - List of herbs with individual fact sheets
# ============================================================================

# Priority herbs (the ones that were returning 404 from NIH ODS)
PRIORITY_HERBS = [
    ("ginger", "Ginger"),
    ("turmeric", "Turmeric"),
    ("melatonin", "Melatonin"),
    ("echinacea", "Echinacea"),
    ("st-johns-wort", "St. John's Wort"),
    ("garlic", "Garlic"),
    ("ginkgo", "Ginkgo"),
    ("green-tea", "Green Tea"),
    ("chamomile", "Chamomile"),
    ("peppermint-oil", "Peppermint Oil"),
]

# Additional herbs available on NCCIH
ADDITIONAL_HERBS = [
    ("aloe-vera", "Aloe Vera"),
    ("asian-ginseng", "Asian Ginseng"),
    ("astragalus", "Astragalus"),
    ("bilberry", "Bilberry"),
    ("bitter-orange", "Bitter Orange"),
    ("black-cohosh", "Black Cohosh"),
    ("butterbur", "Butterbur"),
    ("cats-claw", "Cat's Claw"),
    ("chaste-tree-berry", "Chaste Tree Berry (Vitex)"),
    ("cinnamon", "Cinnamon"),
    ("cranberry", "Cranberry"),
    ("dandelion", "Dandelion"),
    ("elderberry", "Elderberry"),
    ("ephedra", "Ephedra"),
    ("european-mistletoe", "European Mistletoe"),
    ("evening-primrose-oil", "Evening Primrose Oil"),
    ("fenugreek", "Fenugreek"),
    ("feverfew", "Feverfew"),
    ("flaxseed-and-flaxseed-oil", "Flaxseed and Flaxseed Oil"),
    ("goldenseal", "Goldenseal"),
    ("gotu-kola", "Gotu Kola"),
    ("grape-seed-extract", "Grape Seed Extract"),
    ("hawthorn", "Hawthorn"),
    ("hoodia", "Hoodia"),
    ("horse-chestnut", "Horse Chestnut"),
    ("kava", "Kava"),
    ("lavender", "Lavender"),
    ("licorice-root", "Licorice Root"),
    ("milk-thistle", "Milk Thistle"),
    ("noni", "Noni"),
    ("passionflower", "Passionflower"),
    ("red-clover", "Red Clover"),
    ("rhodiola", "Rhodiola"),
    ("saw-palmetto", "Saw Palmetto"),
    ("soy", "Soy"),
    ("tea-tree-oil", "Tea Tree Oil"),
    ("thunder-god-vine", "Thunder God Vine"),
    ("valerian", "Valerian"),
    ("yohimbe", "Yohimbe"),
]

# Combine all herbs
ALL_NCCIH_HERBS = PRIORITY_HERBS + ADDITIONAL_HERBS


def get_herb_links_from_index() -> list[tuple[str, str]]:
    """Scrape the herbs-at-a-glance index to get all herb links."""
    print("Fetching NCCIH Herbs at a Glance index...", flush=True)

    index_url = "https://www.nccih.nih.gov/health/herbsataglance"
    html = fetch_url(index_url, delay=False)

    if not html:
        print("  Failed to fetch index, using predefined list", flush=True)
        return ALL_NCCIH_HERBS

    herbs = []
    seen = set()

    # Look for links to individual herb pages
    # Pattern: /health/herb-name or /health/herbs/herb-name
    pattern = r'href="(/health/([a-z0-9-]+))"[^>]*>([^<]+)</a>'
    matches = re.findall(pattern, html, re.IGNORECASE)

    for path, slug, title in matches:
        # Skip non-herb pages
        skip_patterns = ['herbsataglance', 'atoz', 'tips', 'safety', 'providers',
                         'research', 'training', 'about', 'contact', 'privacy']
        if any(x in slug.lower() for x in skip_patterns):
            continue

        if slug not in seen:
            seen.add(slug)
            title = title.strip()
            if title and len(title) > 1:
                herbs.append((slug, title))

    print(f"  Found {len(herbs)} herbs from index", flush=True)

    # Merge with predefined list to ensure we get priority herbs
    for slug, title in ALL_NCCIH_HERBS:
        if slug not in seen:
            herbs.append((slug, title))
            seen.add(slug)

    print(f"  Total herbs to scrape: {len(herbs)}", flush=True)
    return herbs


def scrape_nccih_herb(slug: str, title: str) -> Optional[str]:
    """Scrape content from an NCCIH herb fact sheet."""
    url = f"https://www.nccih.nih.gov/health/{slug}"
    html = fetch_url(url)

    if not html:
        return None

    content = ""

    # NCCIH pages have specific structure - look for main content
    main_patterns = [
        r'<main[^>]*>(.*?)</main>',
        r'<article[^>]*>(.*?)</article>',
        r'<div[^>]*class="[^"]*main-content[^"]*"[^>]*>(.*?)</div>',
        r'<div[^>]*id="main"[^>]*>(.*?)</div>',
        r'<div[^>]*class="[^"]*field--name-body[^"]*"[^>]*>(.*?)</div>',
    ]

    for pattern in main_patterns:
        match = re.search(pattern, html, re.DOTALL | re.IGNORECASE)
        if match:
            extracted = extract_text(match.group(1))
            if len(extracted) > len(content):
                content = extracted

    # If still no content, try broader extraction
    if not content or len(content) < 100:
        # Look for content between specific markers
        body_match = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL | re.IGNORECASE)
        if body_match:
            content = extract_text(body_match.group(1))

    # Clean up whitespace
    content = re.sub(r'\s+', ' ', content).strip()

    # Remove boilerplate phrases
    boilerplate = [
        r'National Center for Complementary and Integrative Health.*?(?=\s[A-Z])',
        r'NCCIH Clearinghouse.*',
        r'This publication is not copyrighted.*',
        r'Last Updated.*',
        r'Skip to main content.*',
        r'An official website of.*',
        r'Menu.*?(?=\s[A-Z][a-z])',
        r'Search.*?(?=\s[A-Z][a-z])',
        r'Share this page.*',
        r'Print this page.*',
        r'Email Updates.*',
        r'Follow us on.*',
        r'More information.*',
        r'References.*',
        r'Disclaimers.*',
    ]

    for pattern in boilerplate:
        content = re.sub(pattern, '', content, flags=re.IGNORECASE)

    # Final cleanup
    content = re.sub(r'\s+', ' ', content).strip()

    # Ensure we have meaningful content
    if len(content) < 100:
        return None

    return content


def scrape_nccih_herbs() -> list[RagEntry]:
    """Scrape all NCCIH herb fact sheets."""
    print("\n" + "="*60, flush=True)
    print("SCRAPING: NCCIH Herbs at a Glance", flush=True)
    print("="*60, flush=True)

    entries = []
    herbs = get_herb_links_from_index()

    successful = 0
    failed = 0

    for i, (slug, title) in enumerate(herbs):
        print(f"  [{i+1}/{len(herbs)}] {title}...", flush=True)

        content = scrape_nccih_herb(slug, title)
        if not content:
            print(f"    -> Failed or no content", flush=True)
            failed += 1
            continue

        successful += 1
        chunks = chunk_text(content)
        print(f"    -> {len(content)} chars, {len(chunks)} chunk(s)", flush=True)

        for j, chunk in enumerate(chunks):
            entry_id = f"nccih_{i+1:04d}"
            if len(chunks) > 1:
                entry_id += f"_{j+1}"

            url = f"https://www.nccih.nih.gov/health/{slug}"
            entries.append(RagEntry(
                id=entry_id,
                title=title,
                source_name="NCCIH (NIH)",
                url=url,
                license="Public Domain",
                date_accessed=TODAY,
                text_chunk=chunk,
                category="natural_remedy"
            ))

    print(f"\n  Successful: {successful}, Failed: {failed}", flush=True)
    print(f"  Total NCCIH entries: {len(entries)}", flush=True)
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
    """Main scraping function."""
    print("\n" + "="*60, flush=True)
    print("NCCIH Herbs Scraper for HeyDoc RAG", flush=True)
    print("="*60, flush=True)
    print(f"Date: {TODAY}", flush=True)
    print(f"Request delay: {REQUEST_DELAY}s between requests", flush=True)
    print("="*60, flush=True)

    entries = scrape_nccih_herbs()

    # Summary
    print("\n" + "="*60, flush=True)
    print("SUMMARY", flush=True)
    print("="*60, flush=True)
    print(f"Total entries collected: {len(entries)}", flush=True)

    # Write output
    import os
    output_path = os.path.join(os.path.dirname(__file__), 'nccih_herbs.csv')
    output_path = os.path.abspath(output_path)

    write_csv(entries, output_path)
    print(f"\nOutput written to: {output_path}", flush=True)

    return entries


if __name__ == '__main__':
    main()
