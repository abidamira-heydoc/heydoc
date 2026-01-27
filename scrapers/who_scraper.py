#!/usr/bin/env python3
"""
WHO Health Topics Scraper
Scrapes health topic pages and fact sheets from the World Health Organization.

Website: https://www.who.int/health-topics/
License: Public international organization
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
MAX_ENTRIES = 150  # Target 100-150 health topics
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
            print(f"  Access denied (403)", flush=True)
        elif e.code == 429:
            print(f"  Rate limited (429) - waiting longer", flush=True)
            time.sleep(10)
        else:
            print(f"  HTTP Error {e.code}", flush=True)
        return None
    except Exception as e:
        print(f"  Error: {e}", flush=True)
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


# WHO health topics to scrape (curated list of relevant topics)
WHO_TOPICS = [
    # Common symptoms and conditions
    ("headache", "Headache disorders"),
    ("influenza", "Influenza (Flu)"),
    ("diarrhoea", "Diarrhoea"),
    ("malaria", "Malaria"),
    ("dengue", "Dengue"),
    ("cholera", "Cholera"),
    ("tuberculosis", "Tuberculosis"),
    ("hiv", "HIV/AIDS"),
    ("hepatitis", "Hepatitis"),
    ("rabies", "Rabies"),
    ("measles", "Measles"),

    # Respiratory
    ("asthma", "Asthma"),
    ("pneumonia", "Pneumonia"),
    ("chronic-respiratory-diseases", "Chronic Respiratory Diseases"),

    # Cardiovascular
    ("cardiovascular-diseases", "Cardiovascular Diseases"),
    ("hypertension", "Hypertension"),

    # Mental health
    ("mental-health", "Mental Health"),
    ("depression", "Depression"),
    ("suicide", "Suicide Prevention"),

    # Nutrition
    ("nutrition", "Nutrition"),
    ("obesity", "Obesity"),
    ("food-safety", "Food Safety"),
    ("breastfeeding", "Breastfeeding"),

    # Environmental
    ("air-pollution", "Air Pollution"),
    ("water-sanitation-hygiene", "Water, Sanitation and Hygiene"),

    # Maternal/Child
    ("maternal-health", "Maternal Health"),
    ("child-health", "Child Health"),
    ("immunization", "Immunization"),
    ("vaccines", "Vaccines"),

    # NCDs
    ("diabetes", "Diabetes"),
    ("cancer", "Cancer"),
    ("noncommunicable-diseases", "Noncommunicable Diseases"),

    # Infectious
    ("antimicrobial-resistance", "Antimicrobial Resistance"),
    ("zoonoses", "Zoonotic Diseases"),

    # Lifestyle
    ("physical-activity", "Physical Activity"),
    ("tobacco", "Tobacco"),
    ("alcohol", "Alcohol"),

    # Other important topics
    ("ageing", "Ageing and Health"),
    ("blindness", "Blindness and Vision Impairment"),
    ("deafness", "Deafness and Hearing Loss"),
    ("oral-health", "Oral Health"),
    ("patient-safety", "Patient Safety"),
    ("emergencies", "Health Emergencies"),
    ("first-aid", "First Aid"),

    # Recent/trending
    ("coronavirus", "COVID-19"),
    ("mpox", "Mpox"),
]


def get_who_topic_page(topic_slug: str, topic_name: str) -> Optional[dict]:
    """Fetch and parse a WHO health topic page."""
    url = f"https://www.who.int/health-topics/{topic_slug}"

    html = fetch_url(url)
    if not html:
        return None

    content_parts = []
    content_parts.append(f"WHO Health Topic: {topic_name}")

    # Try to extract key facts section
    key_facts_patterns = [
        r'<section[^>]*class="[^"]*key-facts[^"]*"[^>]*>(.*?)</section>',
        r'<div[^>]*class="[^"]*key-facts[^"]*"[^>]*>(.*?)</div>',
        r'Key facts(.*?)(?=<h[23]|</section)',
    ]

    for pattern in key_facts_patterns:
        match = re.search(pattern, html, re.DOTALL | re.IGNORECASE)
        if match:
            key_facts = extract_text(match.group(1))
            if len(key_facts) > 50:
                content_parts.append(f"\nKey Facts: {key_facts}")
                break

    # Try to extract overview section
    overview_patterns = [
        r'<section[^>]*class="[^"]*overview[^"]*"[^>]*>(.*?)</section>',
        r'<div[^>]*class="[^"]*sf-content-block[^"]*"[^>]*>(.*?)</div>',
        r'<section[^>]*id="tab-overview"[^>]*>(.*?)</section>',
        r'Overview(.*?)(?=<h[23]|</section)',
    ]

    for pattern in overview_patterns:
        match = re.search(pattern, html, re.DOTALL | re.IGNORECASE)
        if match:
            overview = extract_text(match.group(1))
            if len(overview) > 100:
                content_parts.append(f"\nOverview: {overview}")
                break

    # Try main content area
    main_patterns = [
        r'<main[^>]*>(.*?)</main>',
        r'<article[^>]*>(.*?)</article>',
        r'<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)</div>',
    ]

    main_content = ""
    for pattern in main_patterns:
        match = re.search(pattern, html, re.DOTALL | re.IGNORECASE)
        if match:
            main_content = extract_text(match.group(1))
            if len(main_content) > 200:
                break

    # If we didn't get key facts or overview, use main content
    if len(' '.join(content_parts)) < 200 and main_content:
        content_parts.append(f"\n{main_content[:2000]}")

    # Clean up content
    content = ' '.join(content_parts)
    content = re.sub(r'\s+', ' ', content).strip()

    # Remove boilerplate
    boilerplate = [
        r'Share.*?Facebook.*?Twitter.*?LinkedIn.*',
        r'WHO response.*',
        r'More.*?WHO.*',
        r'Related links.*',
        r'See all.*',
        r'Download.*PDF.*',
        r'©.*WHO.*',
    ]
    for pattern in boilerplate:
        content = re.sub(pattern, '', content, flags=re.IGNORECASE)

    content = content.strip()

    if len(content) < 150:
        return None

    return {
        'title': topic_name,
        'url': url,
        'content': content,
    }


def get_who_factsheet(topic_slug: str, topic_name: str) -> Optional[dict]:
    """Fetch and parse a WHO fact sheet page."""
    # Try fact sheet URL format
    url = f"https://www.who.int/news-room/fact-sheets/detail/{topic_slug}"

    html = fetch_url(url)
    if not html:
        return None

    content_parts = []
    content_parts.append(f"WHO Fact Sheet: {topic_name}")

    # Extract key facts
    key_facts_pattern = r'<section[^>]*class="[^"]*sf-key-facts[^"]*"[^>]*>(.*?)</section>'
    match = re.search(key_facts_pattern, html, re.DOTALL | re.IGNORECASE)
    if match:
        key_facts = extract_text(match.group(1))
        if len(key_facts) > 50:
            content_parts.append(f"\nKey Facts: {key_facts}")

    # Extract main content sections
    section_pattern = r'<section[^>]*class="[^"]*sf-content-block[^"]*"[^>]*>(.*?)</section>'
    sections = re.findall(section_pattern, html, re.DOTALL | re.IGNORECASE)

    for section in sections[:5]:  # First 5 sections
        section_text = extract_text(section)
        if len(section_text) > 100:
            content_parts.append(f"\n{section_text}")

    content = ' '.join(content_parts)
    content = re.sub(r'\s+', ' ', content).strip()

    # Remove boilerplate
    boilerplate = [
        r'Share.*?Facebook.*?Twitter.*',
        r'©.*WHO.*',
        r'Download.*PDF.*',
    ]
    for pattern in boilerplate:
        content = re.sub(pattern, '', content, flags=re.IGNORECASE)

    content = content.strip()

    if len(content) < 150:
        return None

    return {
        'title': topic_name,
        'url': url,
        'content': content,
    }


def scrape_who_topics() -> list[RagEntry]:
    """Scrape health topics from WHO website."""
    print("\n" + "="*60, flush=True)
    print("SCRAPING: WHO Health Topics", flush=True)
    print("="*60, flush=True)
    print("Note: Using polite scraping with 2-3 sec delays", flush=True)
    print("="*60, flush=True)

    entries = []
    entry_count = 0

    for topic_slug, topic_name in WHO_TOPICS:
        if entry_count >= MAX_ENTRIES:
            print(f"\nReached target of {MAX_ENTRIES} entries", flush=True)
            break

        print(f"\nFetching: {topic_name}...", flush=True)

        # Try health topic page first
        result = get_who_topic_page(topic_slug, topic_name)

        # If that fails, try fact sheet
        if not result:
            print(f"  Trying fact sheet...", flush=True)
            result = get_who_factsheet(topic_slug, topic_name)

        if not result:
            print(f"  No content found", flush=True)
            continue

        content = result['content']
        url = result['url']
        title = result['title']

        print(f"  Got {len(content)} chars", flush=True)

        chunks = chunk_text(content)

        for j, chunk in enumerate(chunks):
            entry_id = f"who_{topic_slug.replace('-', '_')}_{j+1:02d}"

            entries.append(RagEntry(
                id=entry_id,
                title=title,
                source_name="World Health Organization",
                url=url,
                license="Public",
                date_accessed=TODAY,
                text_chunk=chunk,
                category="guidelines"
            ))

        entry_count += len(chunks)
        print(f"  Added {len(chunks)} entries (total: {entry_count})", flush=True)

    print(f"\n  Total WHO entries: {len(entries)}", flush=True)
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
    print("HeyDoc WHO Health Topics Scraper", flush=True)
    print("="*60, flush=True)
    print(f"Date: {TODAY}", flush=True)
    print(f"Request delay: {REQUEST_DELAY_MIN}-{REQUEST_DELAY_MAX}s between requests", flush=True)
    print(f"Target entries: {MAX_ENTRIES}", flush=True)
    print(f"Topics to scrape: {len(WHO_TOPICS)}", flush=True)
    print("="*60, flush=True)

    entries = scrape_who_topics()

    # Summary
    print("\n" + "="*60, flush=True)
    print("SUMMARY", flush=True)
    print("="*60, flush=True)
    print(f"Total entries collected: {len(entries)}", flush=True)

    # Write output
    import os
    output_path = os.path.join(os.path.dirname(__file__), 'who_topics.csv')
    output_path = os.path.abspath(output_path)

    write_csv(entries, output_path)
    print(f"\nOutput written to: {output_path}", flush=True)

    return entries


if __name__ == '__main__':
    main()
