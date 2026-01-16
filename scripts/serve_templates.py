#!/usr/bin/env python3
"""Serve the repository root on port 5500 and open the demo page in the browser.

Usage:
  python scripts/serve_templates.py [--port 5500]
"""
import http.server
import socketserver
import webbrowser
import os
import argparse

p = argparse.ArgumentParser()
p.add_argument("--port", type=int, default=5500)
args = p.parse_args()
PORT = args.port
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

print(f"Serving repository root: {ROOT} on port {PORT}")
Handler = http.server.SimpleHTTPRequestHandler
os.chdir(ROOT)
url = f"http://127.0.0.1:{PORT}/templates/digital_twin.modular.html"

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Opening {url} in the default browser...")
    try:
        webbrowser.open(url)
    except Exception:
        pass
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("Shutting down server")
