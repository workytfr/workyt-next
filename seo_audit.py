import urllib.request, ssl, json, re, sys

def fetch_html(url):
    ctx = ssl.create_default_context()
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    resp = urllib.request.urlopen(req, context=ctx, timeout=15)
    return resp.read().decode('utf-8', errors='replace')

html = fetch_html('https://workyt.fr')

# JSON-LD
json_ld_blocks = re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', html, re.DOTALL)
print(f"JSON-LD blocks found: {len(json_ld_blocks)}")
for i, block in enumerate(json_ld_blocks[:10]):
    try:
        data = json.loads(block.strip())
        t = data.get('@type', data.get('@graph', [{}])[0].get('@type', 'Unknown')) if isinstance(data, dict) else 'Unknown'
        print(f"  Block {i+1}: @type={t}")
    except Exception as e:
        print(f"  Block {i+1}: Parse error: {e}")

# Resources count
scripts = re.findall(r'<script[^>]+src="([^"]+)"', html)
styles = re.findall(r'<link[^>]+stylesheet[^>]+href="([^"]+)"', html)
images = re.findall(r'<img[^>]+src="([^"]+)"', html)
preload = re.findall(r'<link[^>]+rel="preload"[^>]+href="([^"]+)"', html)
print(f"\nScripts: {len(scripts)}")
print(f"Stylesheets: {len(styles)}")
print(f"Images: {len(images)}")
print(f"Preloads: {len(preload)}")
print(f"Total estimated requests: {len(scripts)+len(styles)+len(images)+len(preload)}")
print(f"HTML size: {len(html.encode('utf-8'))/1024:.1f} KB")

# Check redirects with requests if available
try:
    import requests
    print("\n--- Redirect checks with requests ---")
    for u in ['http://workyt.fr', 'https://workyt.fr', 'http://www.workyt.fr', 'https://www.workyt.fr']:
        try:
            r = requests.get(u, allow_redirects=False, timeout=10, headers={'User-Agent':'Mozilla/5.0'})
            loc = r.headers.get('Location')
            print(f"{u}: {r.status_code} -> {loc}")
        except Exception as e:
            print(f"{u}: Error {e}")
except ImportError:
    print("requests not available")

# Pagination check on /cours
print("\n--- Pagination on /cours ---")
try:
    cours_html = fetch_html('https://workyt.fr/cours')
    # Look for pagination patterns
    if 'page=' in cours_html or 'pagination' in cours_html.lower() or 'load more' in cours_html.lower():
        print("Pagination or load more detected")
    else:
        print("No obvious pagination pattern found in extracted text")
except Exception as e:
    print(f"Error fetching /cours: {e}")
