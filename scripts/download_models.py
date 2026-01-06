"""scripts/download_models.py

Simple script to download a list of 3D model files into the frontend assets folder.
Usage:
  python scripts/download_models.py --out frontend/static/assets/models/ urls.txt

`urls.txt` should contain one URL per line.
"""

import argparse
import os
import sys
from urllib.parse import urlparse

try:
    import requests
except Exception:
    print("Please pip install requests")
    sys.exit(1)


def download(url, out_dir):
    parsed = urlparse(url)
    filename = os.path.basename(parsed.path)
    if not filename:
        raise ValueError("URL does not contain a filename: %s" % url)
    dest = os.path.join(out_dir, filename)
    print(f"Downloading {url} -> {dest}")
    r = requests.get(url, stream=True)
    r.raise_for_status()
    with open(dest, "wb") as f:
        for chunk in r.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)
    return dest


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--out", default="frontend/static/assets/models/", help="Output folder for models")
    p.add_argument("urls", nargs="*", help="One or more URLs to download")
    p.add_argument("--file", help="File containing URLs, one per line")
    args = p.parse_args()

    out_dir = args.out
    os.makedirs(out_dir, exist_ok=True)

    urls = []
    if args.file:
        with open(args.file, "r", encoding="utf-8") as fh:
            urls.extend([line.strip() for line in fh if line.strip()])
    urls.extend(args.urls or [])

    if not urls:
        print("No URLs provided")
        return

    for url in urls:
        try:
            download(url, out_dir)
        except Exception as e:
            print("Failed to download", url, e)


if __name__ == "__main__":
    main()
