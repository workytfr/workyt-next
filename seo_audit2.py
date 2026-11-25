import urllib.request, ssl, re

ctx = ssl.create_default_context()
req = urllib.request.Request('https://workyt.fr/cours', headers={'User-Agent': 'Mozilla/5.0'})
resp = urllib.request.urlopen(req, context=ctx, timeout=15)
html = resp.read().decode('utf-8', errors='replace')

patterns = ['page=', 'pagination', 'load more', 'infinite scroll', 'cursor=', 'offset=', '?page', 'rel="next"', 'rel="prev"']
found = []
for p in patterns:
    if p in html.lower():
        found.append(p)
print('Pagination patterns found:', found)

canon = re.search(r'<link rel="canonical" href="([^"]+)"', html)
print('Canonical on /cours:', canon.group(1) if canon else 'None')

robots = re.search(r'<meta name="robots" content="([^"]+)"', html)
print('Robots on /cours:', robots.group(1) if robots else 'None')

# Check if any hreflang exists anywhere on homepage
req2 = urllib.request.Request('https://workyt.fr', headers={'User-Agent': 'Mozilla/5.0'})
resp2 = urllib.request.urlopen(req2, context=ctx, timeout=15)
html2 = resp2.read().decode('utf-8', errors='replace')
hreflangs = re.findall(r'<link rel="alternate"[^>]+hreflang="([^"]+)"', html2)
print('Hreflang tags on homepage:', hreflangs if hreflangs else 'None')

# Check if any next/prev on homepage
next_prev = re.findall(r'<link rel="(next|prev)"[^>]+href="([^"]+)"', html2)
print('Next/Prev on homepage:', next_prev if next_prev else 'None')
