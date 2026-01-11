#!/usr/bin/env python3
"""
Medical Knowledge Base Scraper
Scrapes public domain U.S. government health information sources
for the HeyDoc RAG knowledge base.

Sources:
1. MedlinePlus Health Topics (medlineplus.gov)
2. NIH Office of Dietary Supplements (ods.od.nih.gov)
3. CDC Health Topics (cdc.gov)
"""

import csv
import json
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
REQUEST_DELAY = 2.0  # seconds between requests (polite scraping)
MAX_CHUNK_SIZE = 2000  # max characters per text chunk
MAX_ENTRIES_PER_SOURCE = 200  # limit entries per source for reasonable collection
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
# MedlinePlus Health Topics Scraper
# ============================================================================

def get_medlineplus_topic_links() -> list[tuple[str, str]]:
    """Get all health topic links from MedlinePlus."""
    print("Fetching MedlinePlus health topic index...", flush=True)

    topics = []

    # Get the all topics page
    html = fetch_url("https://medlineplus.gov/all_healthtopics.html", delay=False)
    if not html:
        print("  Failed to fetch index page", flush=True)
        return topics

    # Extract links - look for topic pages
    pattern = r'<a[^>]+href="(https://medlineplus\.gov/([a-z][a-z0-9]*\.html))"[^>]*>([^<]+)</a>'
    matches = re.findall(pattern, html, re.IGNORECASE)

    seen = set()
    for full_url, path, title in matches:
        # Skip non-topic pages
        skip_patterns = ['index', 'about', 'contact', 'privacy', 'terms',
                         'accessibility', 'disclaimer', 'viewers', 'sitemap',
                         'healthtopics', 'languages', 'all_', 'copyright',
                         'medlineplus', 'faq', 'newsletter']
        if any(x in path.lower() for x in skip_patterns):
            continue

        if full_url not in seen:
            seen.add(full_url)
            title = title.strip()
            if title and len(title) > 2:
                topics.append((full_url, title))

    # Also try alternate pattern for relative links
    pattern2 = r'<a[^>]+href="/([a-z][a-z0-9]*\.html)"[^>]*>([^<]+)</a>'
    matches2 = re.findall(pattern2, html, re.IGNORECASE)

    for path, title in matches2:
        skip_patterns = ['index', 'about', 'contact', 'privacy', 'terms',
                         'accessibility', 'disclaimer', 'viewers', 'sitemap',
                         'healthtopics', 'languages', 'all_', 'copyright',
                         'medlineplus', 'faq', 'newsletter']
        if any(x in path.lower() for x in skip_patterns):
            continue

        full_url = f"https://medlineplus.gov/{path}"
        if full_url not in seen:
            seen.add(full_url)
            title = title.strip()
            if title and len(title) > 2:
                topics.append((full_url, title))

    print(f"  Found {len(topics)} unique health topics", flush=True)
    return topics[:MAX_ENTRIES_PER_SOURCE]


def scrape_medlineplus_topic(url: str, title: str) -> Optional[str]:
    """Scrape content from a MedlinePlus topic page."""
    html = fetch_url(url)
    if not html:
        return None

    content = ""

    # Look for the main topic summary section
    summary_patterns = [
        r'<div[^>]*class="[^"]*mp-summary[^"]*"[^>]*>(.*?)</div>',
        r'<section[^>]*class="[^"]*summary[^"]*"[^>]*>(.*?)</section>',
        r'<div[^>]*id="topic-summary"[^>]*>(.*?)</div>',
        r'<div[^>]*class="[^"]*summary[^"]*"[^>]*>(.*?)</div>',
    ]

    for pattern in summary_patterns:
        match = re.search(pattern, html, re.DOTALL | re.IGNORECASE)
        if match:
            content = extract_text(match.group(1))
            if len(content) > 100:
                break

    # Try main article content
    if not content or len(content) < 100:
        article_match = re.search(
            r'<article[^>]*>(.*?)</article>',
            html, re.DOTALL | re.IGNORECASE
        )
        if article_match:
            content = extract_text(article_match.group(1))

    # Fallback to main element
    if not content or len(content) < 100:
        main_match = re.search(
            r'<main[^>]*>(.*?)</main>',
            html, re.DOTALL | re.IGNORECASE
        )
        if main_match:
            content = extract_text(main_match.group(1))

    # Clean up
    content = re.sub(r'\s+', ' ', content).strip()

    # Remove boilerplate
    boilerplate = [
        r'See, Play and Learn.*?(?=\.|$)',
        r'No links available.*?(?=\.|$)',
        r'NIH: National.*',
        r'Start Here.*?(?=\.|$)',
        r'Learn More.*?(?=\.|$)',
        r'Related Issues.*',
        r'Diagnosis and Tests.*',
        r'Statistics and Research.*',
        r'Clinical Trials.*',
        r'Journal Articles.*',
    ]
    for pattern in boilerplate:
        content = re.sub(pattern, '', content, flags=re.IGNORECASE)

    return content.strip() if len(content) > 50 else None


def scrape_medlineplus_topics() -> list[RagEntry]:
    """Scrape MedlinePlus health topics."""
    print("\n" + "="*60, flush=True)
    print("SCRAPING: MedlinePlus Health Topics", flush=True)
    print("="*60, flush=True)

    entries = []
    topics = get_medlineplus_topic_links()

    for i, (url, title) in enumerate(topics):
        print(f"  [{i+1}/{len(topics)}] {title}...", flush=True)

        content = scrape_medlineplus_topic(url, title)
        if not content:
            continue

        chunks = chunk_text(content)

        for j, chunk in enumerate(chunks):
            entry_id = f"medlineplus_{i+1:04d}"
            if len(chunks) > 1:
                entry_id += f"_{j+1}"

            entries.append(RagEntry(
                id=entry_id,
                title=title,
                source_name="MedlinePlus",
                url=url,
                license="Public Domain",
                date_accessed=TODAY,
                text_chunk=chunk,
                category="condition"
            ))

    print(f"\n  Total MedlinePlus entries: {len(entries)}", flush=True)
    return entries


# ============================================================================
# NIH Office of Dietary Supplements Scraper
# ============================================================================

# Known ODS fact sheets (curated list for reliability)
ODS_FACTSHEETS = [
    ("VitaminA", "Vitamin A"),
    ("VitaminB6", "Vitamin B6"),
    ("VitaminB12", "Vitamin B12"),
    ("VitaminC", "Vitamin C"),
    ("VitaminD", "Vitamin D"),
    ("VitaminE", "Vitamin E"),
    ("VitaminK", "Vitamin K"),
    ("Thiamin", "Thiamin (Vitamin B1)"),
    ("Riboflavin", "Riboflavin (Vitamin B2)"),
    ("Niacin", "Niacin (Vitamin B3)"),
    ("PantothenicAcid", "Pantothenic Acid (Vitamin B5)"),
    ("Biotin", "Biotin"),
    ("Folate", "Folate"),
    ("Calcium", "Calcium"),
    ("Chromium", "Chromium"),
    ("Copper", "Copper"),
    ("Iodine", "Iodine"),
    ("Iron", "Iron"),
    ("Magnesium", "Magnesium"),
    ("Manganese", "Manganese"),
    ("Molybdenum", "Molybdenum"),
    ("Phosphorus", "Phosphorus"),
    ("Potassium", "Potassium"),
    ("Selenium", "Selenium"),
    ("Zinc", "Zinc"),
    ("Omega3FattyAcids", "Omega-3 Fatty Acids"),
    ("Probiotics", "Probiotics"),
    ("Multivitamin", "Multivitamins"),
    ("Ashwagandha", "Ashwagandha"),
    ("BlackCohosh", "Black Cohosh"),
    ("Echinacea", "Echinacea"),
    ("Garlic", "Garlic"),
    ("Ginger", "Ginger"),
    ("Ginkgo", "Ginkgo"),
    ("Ginseng", "Asian Ginseng"),
    ("GreenTea", "Green Tea"),
    ("Kava", "Kava"),
    ("Melatonin", "Melatonin"),
    ("MilkThistle", "Milk Thistle"),
    ("SawPalmetto", "Saw Palmetto"),
    ("StJohnsWort", "St. John's Wort"),
    ("Turmeric", "Turmeric"),
    ("Valerian", "Valerian"),
    ("CoQ10", "Coenzyme Q10"),
    ("Glucosamine", "Glucosamine"),
    ("Chondroitin", "Chondroitin"),
    ("DHEA", "DHEA"),
    ("WeightLoss", "Dietary Supplements for Weight Loss"),
    ("ExerciseAndAthleticPerformance", "Dietary Supplements for Exercise and Athletic Performance"),
]


def scrape_ods_factsheet(url_name: str, title: str) -> Optional[str]:
    """Scrape content from an NIH ODS fact sheet."""
    url = f"https://ods.od.nih.gov/factsheets/{url_name}-Consumer/"
    html = fetch_url(url)
    if not html:
        return None

    content = ""

    # Look for main content
    main_patterns = [
        r'<main[^>]*>(.*?)</main>',
        r'<article[^>]*>(.*?)</article>',
        r'<div[^>]*class="[^"]*main-content[^"]*"[^>]*>(.*?)</div>',
        r'<div[^>]*id="main-content"[^>]*>(.*?)</div>',
    ]

    for pattern in main_patterns:
        match = re.search(pattern, html, re.DOTALL | re.IGNORECASE)
        if match:
            extracted = extract_text(match.group(1))
            if len(extracted) > len(content):
                content = extracted

    # Clean up
    content = re.sub(r'\s+', ' ', content).strip()

    # Remove boilerplate
    boilerplate = [
        r'Printer friendly version.*',
        r'For more information.*',
        r'This fact sheet.*Office of Dietary Supplements.*',
        r'Disclaimers.*',
    ]
    for pattern in boilerplate:
        content = re.sub(pattern, '', content, flags=re.IGNORECASE)

    return content if len(content) > 50 else None


def scrape_ods_factsheets() -> list[RagEntry]:
    """Scrape NIH ODS fact sheets."""
    print("\n" + "="*60, flush=True)
    print("SCRAPING: NIH Office of Dietary Supplements", flush=True)
    print("="*60, flush=True)

    entries = []

    for i, (url_name, title) in enumerate(ODS_FACTSHEETS):
        print(f"  [{i+1}/{len(ODS_FACTSHEETS)}] {title}...", flush=True)

        content = scrape_ods_factsheet(url_name, title)
        if not content:
            continue

        chunks = chunk_text(content)

        # Determine category
        if any(x in title.lower() for x in ['vitamin', 'mineral', 'calcium', 'iron', 'zinc', 'magnesium', 'potassium']):
            category = "supplement"
        else:
            category = "natural_remedy"

        for j, chunk in enumerate(chunks):
            entry_id = f"nih_ods_{i+1:04d}"
            if len(chunks) > 1:
                entry_id += f"_{j+1}"

            url = f"https://ods.od.nih.gov/factsheets/{url_name}-Consumer/"
            entries.append(RagEntry(
                id=entry_id,
                title=title,
                source_name="NIH Office of Dietary Supplements",
                url=url,
                license="Public Domain",
                date_accessed=TODAY,
                text_chunk=chunk,
                category=category
            ))

    print(f"\n  Total NIH ODS entries: {len(entries)}", flush=True)
    return entries


# ============================================================================
# CDC Health Topics Scraper
# ============================================================================

def get_cdc_topics() -> list[tuple[str, str, str]]:
    """Get CDC health topics from their JSON API."""
    print("Fetching CDC topics from API...", flush=True)

    topics = []

    json_str = fetch_url("https://www.cdc.gov/az/az-export.json", delay=False)
    if not json_str:
        print("  Failed to fetch CDC JSON", flush=True)
        return topics

    try:
        data = json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"  Failed to parse JSON: {e}", flush=True)
        return topics

    seen_urls = set()
    for item in data:
        if not isinstance(item, dict):
            continue

        url = item.get('url', '')
        title = item.get('title', '')

        # Clean HTML from title
        title = re.sub(r'<[^>]+>', '', title)

        if url and title and url not in seen_urls:
            # Skip non-content URLs
            if any(x in url for x in ['/media/', '/images/', '.pdf', '.zip', '/forms/', '/data/']):
                continue
            seen_urls.add(url)

            # Determine category
            if 'prevention' in url.lower() or 'prevent' in title.lower():
                category = 'prevention'
            elif any(x in url.lower() for x in ['vaccine', 'immunization']):
                category = 'prevention'
            else:
                category = 'condition'

            topics.append((url, title, category))

    print(f"  Found {len(topics)} CDC topics", flush=True)
    return topics[:MAX_ENTRIES_PER_SOURCE]


def scrape_cdc_topic(url: str, title: str) -> Optional[str]:
    """Scrape content from a CDC topic page."""
    html = fetch_url(url)
    if not html:
        return None

    content = ""

    # Try main content areas
    patterns = [
        r'<main[^>]*>(.*?)</main>',
        r'<article[^>]*>(.*?)</article>',
        r'<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)</div>',
        r'<div[^>]*id="content"[^>]*>(.*?)</div>',
        r'<div[^>]*class="[^"]*cdc-main[^"]*"[^>]*>(.*?)</div>',
    ]

    for pattern in patterns:
        match = re.search(pattern, html, re.DOTALL | re.IGNORECASE)
        if match:
            extracted = extract_text(match.group(1))
            if len(extracted) > len(content):
                content = extracted

    # Clean up
    content = re.sub(r'\s+', ' ', content).strip()

    # Remove boilerplate
    boilerplate = [
        r'Centers for Disease Control and Prevention.*',
        r'File Formats Help.*',
        r'Page last reviewed.*',
        r'Content source.*',
        r'CDC 24/7.*',
        r'Share Facebook Twitter.*',
    ]
    for pattern in boilerplate:
        content = re.sub(pattern, '', content, flags=re.IGNORECASE)

    return content if len(content) > 50 else None


def scrape_cdc_topics() -> list[RagEntry]:
    """Scrape CDC health topics."""
    print("\n" + "="*60, flush=True)
    print("SCRAPING: CDC Health Topics", flush=True)
    print("="*60, flush=True)

    entries = []
    topics = get_cdc_topics()

    for i, (url, title, category) in enumerate(topics):
        print(f"  [{i+1}/{len(topics)}] {title}...", flush=True)

        content = scrape_cdc_topic(url, title)
        if not content:
            continue

        chunks = chunk_text(content)

        for j, chunk in enumerate(chunks):
            entry_id = f"cdc_{i+1:04d}"
            if len(chunks) > 1:
                entry_id += f"_{j+1}"

            entries.append(RagEntry(
                id=entry_id,
                title=title,
                source_name="CDC",
                url=url,
                license="Public Domain",
                date_accessed=TODAY,
                text_chunk=chunk,
                category=category
            ))

    print(f"\n  Total CDC entries: {len(entries)}", flush=True)
    return entries


# ============================================================================
# Main Execution
# ============================================================================

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
    print("HeyDoc Medical Knowledge Base Scraper", flush=True)
    print("="*60, flush=True)
    print(f"Date: {TODAY}", flush=True)
    print(f"Request delay: {REQUEST_DELAY}s between requests", flush=True)
    print(f"Max entries per source: {MAX_ENTRIES_PER_SOURCE}", flush=True)
    print("="*60, flush=True)

    all_entries = []

    # Scrape each source
    try:
        medlineplus_entries = scrape_medlineplus_topics()
        all_entries.extend(medlineplus_entries)
    except Exception as e:
        print(f"Error scraping MedlinePlus: {e}", flush=True)

    try:
        ods_entries = scrape_ods_factsheets()
        all_entries.extend(ods_entries)
    except Exception as e:
        print(f"Error scraping NIH ODS: {e}", flush=True)

    try:
        cdc_entries = scrape_cdc_topics()
        all_entries.extend(cdc_entries)
    except Exception as e:
        print(f"Error scraping CDC: {e}", flush=True)

    # Summary
    print("\n" + "="*60, flush=True)
    print("SUMMARY", flush=True)
    print("="*60, flush=True)
    print(f"Total entries collected: {len(all_entries)}", flush=True)

    # Count by source
    by_source = {}
    for entry in all_entries:
        by_source[entry.source_name] = by_source.get(entry.source_name, 0) + 1

    for source, count in by_source.items():
        print(f"  - {source}: {count}", flush=True)

    # Count by category
    by_category = {}
    for entry in all_entries:
        by_category[entry.category] = by_category.get(entry.category, 0) + 1

    print("\nBy category:", flush=True)
    for category, count in by_category.items():
        print(f"  - {category}: {count}", flush=True)

    # Write output
    import os
    output_path = os.path.join(os.path.dirname(__file__), '..', 'heydoc_rag_seed.csv')
    output_path = os.path.abspath(output_path)

    write_csv(all_entries, output_path)
    print(f"\nOutput written to: {output_path}", flush=True)

    return all_entries


if __name__ == '__main__':
    main()
