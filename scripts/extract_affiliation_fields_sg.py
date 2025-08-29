#!/usr/bin/env python3
"""
Extract selected fields from affiliation_merchants.json where country_filter == 'SG' and base_mpd is not null.
Outputs:
    1. JSON file (list of objects) with fields: base_mpd, merchantName, merchant_slug, trackingLink
    2. CSV file with the same columns (one row per merchant)

Default behavior now writes BOTH JSON and CSV unless disabled.

Usage examples:
    # Write both JSON (default path) and CSV (default path)
    python3 scripts/extract_affiliation_fields_sg.py \
            --input dataset/affiliation_merchants_full.json

    # Specify custom output paths
    python3 scripts/extract_affiliation_fields_sg.py \
            --input dataset/affiliation_merchants_full.json \
            --output dataset/extracted_merchants_sg.json \
            --csv-output dataset/extracted_merchants_sg.csv

    # Only JSON
    python3 scripts/extract_affiliation_fields_sg.py --input dataset/affiliation_merchants_full.json --no-csv

    # Only CSV
    python3 scripts/extract_affiliation_fields_sg.py --input dataset/affiliation_merchants_full.json --no-json
"""
import argparse
import csv
import json
from typing import Any, Dict, List


def is_nonnull(value: Any) -> bool:
    return value is not None and (not (isinstance(value, str) and value.strip().lower() in ["", "null"]))


def extract(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    out = []
    for obj in items:
        try:
            if obj.get("country_filter") != "SG":
                continue
            if not is_nonnull(obj.get("base_mpd")):
                continue
            out.append({
                "base_mpd": obj.get("base_mpd"),
                "merchantName": obj.get("merchantName"),
                "merchant_slug": obj.get("merchant_slug"),
                "trackingLink": obj.get("trackingLink"),
            })
        except Exception:
            # ignore malformed entries
            continue
    return out


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True, help="Path to affiliation_merchants.json")
    p.add_argument("--output", required=False, default="dataset/extracted_merchants_sg.json", help="Output JSON path (default: dataset/extracted_merchants_sg.json)")
    p.add_argument("--csv-output", required=False, default="dataset/extracted_merchants_sg.csv", help="Output CSV path (default: dataset/extracted_merchants_sg.csv)")
    p.add_argument("--no-json", action="store_true", help="Skip writing JSON output")
    p.add_argument("--no-csv", action="store_true", help="Skip writing CSV output")
    p.add_argument("--pretty", action="store_true", help="Pretty-print JSON output")
    args = p.parse_args()

    with open(args.input, "r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, dict):
        # if file contains a dict with a top-level list under some key, try to find it
        # otherwise treat the dict itself as a single record
        # try common keys
        for k in ("data", "items", "merchants", "results"):
            if k in data and isinstance(data[k], list):
                data_list = data[k]
                break
        else:
            # not a list container; wrap single dict
            data_list = [data]
    elif isinstance(data, list):
        data_list = data
    else:
        raise SystemExit("Unsupported JSON structure in input file")

    extracted = extract(data_list)

    if not args.no_json:
        with open(args.output, "w", encoding="utf-8") as f:
            if args.pretty:
                json.dump(extracted, f, ensure_ascii=False, indent=2)
            else:
                json.dump(extracted, f, ensure_ascii=False)

    if not args.no_csv:
        fieldnames = ["base_mpd", "merchantName", "merchant_slug", "trackingLink"]
        with open(args.csv_output, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for row in extracted:
                writer.writerow({k: row.get(k, "") for k in fieldnames})

    outputs = []
    if not args.no_json:
        outputs.append(f"JSON -> {args.output}")
    if not args.no_csv:
        outputs.append(f"CSV -> {args.csv_output}")
    outputs_str = ", ".join(outputs) if outputs else "(no files written)" 
    print(f"Wrote {len(extracted)} records. Outputs: {outputs_str}")


if __name__ == "__main__":
    main()
