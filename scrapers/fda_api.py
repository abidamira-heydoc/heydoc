#!/usr/bin/env python3
"""
FDA openFDA API Fetcher
Fetches drug information from the official openFDA REST API.

API Documentation: https://open.fda.gov/apis/drug/label/
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

# Configuration
REQUEST_DELAY = 0.5  # Polite delay between requests
MAX_CHUNK_SIZE = 2000
TODAY = date.today().isoformat()
USER_AGENT = "HeyDoc-RAG-Fetcher/1.0 (Educational/Healthcare Research)"
BASE_URL = "https://api.fda.gov/drug/label.json"

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


# Common OTC drugs to fetch
OTC_DRUGS = [
    # Pain relievers / Fever reducers
    "acetaminophen",
    "ibuprofen",
    "aspirin",
    "naproxen",
    "excedrin",
    "tylenol",
    "advil",
    "aleve",

    # Allergy / Cold / Flu
    "diphenhydramine",
    "loratadine",
    "cetirizine",
    "fexofenadine",
    "pseudoephedrine",
    "phenylephrine",
    "dextromethorphan",
    "guaifenesin",
    "chlorpheniramine",
    "brompheniramine",
    "triprolidine",
    "oxymetazoline",
    "zyrtec",
    "claritin",
    "allegra",
    "benadryl",
    "sudafed",
    "mucinex",
    "robitussin",
    "nyquil",
    "dayquil",

    # Digestive
    "omeprazole",
    "famotidine",
    "calcium carbonate",
    "bismuth subsalicylate",
    "loperamide",
    "docusate",
    "simethicone",
    "magnesium hydroxide",
    "sodium bicarbonate",
    "ranitidine",
    "lansoprazole",
    "esomeprazole",
    "tums",
    "pepto bismol",
    "imodium",
    "prilosec",
    "pepcid",
    "nexium",
    "miralax",

    # Sleep aids
    "melatonin",
    "doxylamine",
    "valerian",
    "unisom",
    "zzzquil",

    # Topical
    "hydrocortisone",
    "bacitracin",
    "benzoyl peroxide",
    "salicylic acid",
    "clotrimazole",
    "miconazole",
    "terbinafine",
    "lidocaine",
    "benzocaine",
    "calamine",
    "neosporin",
    "cortisone",
    "lotrimin",
    "lamisil",

    # Eye care
    "tetrahydrozoline",
    "naphazoline",
    "ketotifen",
    "visine",

    # Vitamins/Supplements
    "vitamin c",
    "vitamin d",
    "vitamin b12",
    "iron",
    "zinc",
    "calcium",
    "magnesium",
    "fish oil",
    "probiotics",
    "multivitamin",

    # Other common
    "caffeine",
    "nicotine",
    "dramamine",
    "meclizine",
    "dimenhydrinate",
]


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
        if e.code == 404:
            return None  # No results, not an error
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


def clean_text(text) -> str:
    """Clean and normalize text from API response."""
    if isinstance(text, list):
        text = ' '.join(str(t) for t in text)
    elif not isinstance(text, str):
        text = str(text)

    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def search_drug(drug_name: str) -> Optional[dict]:
    """Search for a drug using openFDA API."""
    # Search for OTC drugs with this active ingredient
    query = f'openfda.generic_name:"{drug_name}" AND openfda.product_type:"HUMAN OTC DRUG"'
    params = {
        'search': query,
        'limit': 1,
    }

    url = f"{BASE_URL}?" + urllib.parse.urlencode(params)

    response = fetch_url(url)
    if not response:
        # Try without OTC filter
        query = f'openfda.generic_name:"{drug_name}"'
        params['search'] = query
        url = f"{BASE_URL}?" + urllib.parse.urlencode(params)
        response = fetch_url(url)

    if not response:
        # Try brand name search
        query = f'openfda.brand_name:"{drug_name}"'
        params['search'] = query
        url = f"{BASE_URL}?" + urllib.parse.urlencode(params)
        response = fetch_url(url)

    if not response:
        return None

    try:
        data = json.loads(response)
        results = data.get('results', [])
        if results:
            return results[0]
        return None
    except json.JSONDecodeError:
        return None


def extract_drug_info(drug_data: dict, drug_name: str) -> Optional[dict]:
    """Extract relevant information from openFDA drug data."""
    openfda = drug_data.get('openfda', {})

    # Get drug name
    brand_names = openfda.get('brand_name', [])
    generic_names = openfda.get('generic_name', [])

    title = brand_names[0] if brand_names else (generic_names[0] if generic_names else drug_name.title())

    # Build content from drug label sections
    content_parts = []
    content_parts.append(f"Drug: {title}")

    if generic_names:
        content_parts.append(f"Generic Name: {', '.join(generic_names[:3])}")

    # Active ingredients
    active = drug_data.get('active_ingredient', [])
    if active:
        content_parts.append(f"Active Ingredients: {clean_text(active[:3])}")

    # Purpose
    purpose = drug_data.get('purpose', [])
    if purpose:
        content_parts.append(f"Purpose: {clean_text(purpose)}")

    # Indications and usage
    indications = drug_data.get('indications_and_usage', [])
    if indications:
        ind_text = clean_text(indications)[:500]
        content_parts.append(f"Uses: {ind_text}")

    # Warnings
    warnings = drug_data.get('warnings', [])
    if warnings:
        warn_text = clean_text(warnings)[:500]
        content_parts.append(f"Warnings: {warn_text}")

    # Do not use
    do_not_use = drug_data.get('do_not_use', [])
    if do_not_use:
        content_parts.append(f"Do Not Use: {clean_text(do_not_use)[:300]}")

    # Ask a doctor
    ask_doctor = drug_data.get('ask_doctor', [])
    if ask_doctor:
        content_parts.append(f"Ask a Doctor Before Use If: {clean_text(ask_doctor)[:300]}")

    # Drug interactions
    interactions = drug_data.get('drug_interactions', [])
    if interactions:
        content_parts.append(f"Drug Interactions: {clean_text(interactions)[:400]}")

    # Dosage
    dosage = drug_data.get('dosage_and_administration', [])
    if dosage:
        dose_text = clean_text(dosage)[:400]
        content_parts.append(f"Dosage: {dose_text}")

    # Stop use
    stop_use = drug_data.get('stop_use', [])
    if stop_use:
        content_parts.append(f"Stop Use and Ask a Doctor If: {clean_text(stop_use)[:300]}")

    # Pregnancy warning
    pregnancy = drug_data.get('pregnancy_or_breast_feeding', [])
    if pregnancy:
        content_parts.append(f"Pregnancy/Breastfeeding: {clean_text(pregnancy)[:200]}")

    # Overdosage
    overdosage = drug_data.get('overdosage', [])
    if overdosage:
        content_parts.append(f"Overdosage: {clean_text(overdosage)[:200]}")

    content = ' '.join(content_parts)

    if len(content) < 200:
        return None

    # Build URL
    set_id = openfda.get('spl_set_id', [''])[0]
    if set_id:
        url = f"https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid={set_id}"
    else:
        url = f"https://dailymed.nlm.nih.gov/dailymed/search.cfm?query={urllib.parse.quote(drug_name)}"

    return {
        'title': title,
        'content': content,
        'url': url,
    }


def fetch_fda_drugs() -> list[RagEntry]:
    """Fetch drug information from openFDA API."""
    print("\n" + "="*60, flush=True)
    print("FETCHING: FDA Drug Information (openFDA API)", flush=True)
    print("="*60, flush=True)

    entries = []
    seen_drugs = set()

    for drug_name in OTC_DRUGS:
        print(f"\nSearching: {drug_name}...", flush=True)

        drug_data = search_drug(drug_name)

        if not drug_data:
            print(f"  No results found", flush=True)
            continue

        # Check if we've seen this drug
        openfda = drug_data.get('openfda', {})
        spl_id = openfda.get('spl_set_id', [''])[0]
        if spl_id in seen_drugs:
            print(f"  Already processed", flush=True)
            continue
        if spl_id:
            seen_drugs.add(spl_id)

        # Extract info
        drug_info = extract_drug_info(drug_data, drug_name)
        if not drug_info:
            print(f"  Insufficient content", flush=True)
            continue

        print(f"  Found: {drug_info['title'][:40]}...", flush=True)

        # Chunk the content
        chunks = chunk_text(drug_info['content'])

        for j, chunk in enumerate(chunks):
            entry_id = f"fda_{drug_name.replace(' ', '_').lower()}_{j+1:02d}"

            entries.append(RagEntry(
                id=entry_id,
                title=drug_info['title'],
                source_name="FDA openFDA",
                url=drug_info['url'],
                license="Public Domain",
                date_accessed=TODAY,
                text_chunk=chunk,
                category="drug_info"
            ))

        print(f"  Added {len(chunks)} entries", flush=True)

    print(f"\n  Total FDA entries: {len(entries)}", flush=True)
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
    print("HeyDoc FDA openFDA API Fetcher", flush=True)
    print("="*60, flush=True)
    print(f"Date: {TODAY}", flush=True)
    print(f"Request delay: {REQUEST_DELAY}s between requests", flush=True)
    print(f"Target drugs: {len(OTC_DRUGS)}", flush=True)
    print("="*60, flush=True)

    entries = fetch_fda_drugs()

    # Summary
    print("\n" + "="*60, flush=True)
    print("SUMMARY", flush=True)
    print("="*60, flush=True)
    print(f"Total entries collected: {len(entries)}", flush=True)

    # Write output
    import os
    output_path = os.path.join(os.path.dirname(__file__), 'fda_drugs.csv')
    output_path = os.path.abspath(output_path)

    write_csv(entries, output_path)
    print(f"\nOutput written to: {output_path}", flush=True)

    return entries


if __name__ == '__main__':
    main()
