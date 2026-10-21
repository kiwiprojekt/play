"""Check local HTML/CSS links and every configured memory image, without a browser."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import re
import json
import sys

root = Path(__file__).resolve().parents[1]
missing = []
checked = 0

def check(value, base):
    global checked
    if value.startswith(('data:', '#', 'mailto:', 'http:', 'https:')):
        return
    path = unquote(urlsplit(value).path)
    if not path:
        return
    target = (root / path.lstrip('/')) if path.startswith('/') else (base / path)
    checked += 1
    if not target.exists():
        missing.append(str(target.relative_to(root)))

class Links(HTMLParser):
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ('href', 'src') and value:
                check(value, self.base)

for path in root.rglob('*'):
    if not path.is_file() or any(part in ('node_modules', '.git') for part in path.parts):
        continue
    if path.suffix == '.html':
        parser = Links()
        parser.base = path.parent
        parser.feed(path.read_text())
    elif path.suffix == '.css':
        for value in re.findall(r'url\([\'"]?([^\'"\)]+)', path.read_text()):
            check(value, path.parent)

# Memory paths are generated from a small, explicit config in script.js.
source = (root / 'memo/script.js').read_text().split('const memoRuntime')[0]
for block in source.split('imageBase: ')[1:]:
    base = block.split('"')[1]
    for name in re.findall(r'"([^"\n]+\.webp)"', block)[0:]:
        check(name, root / 'memo' / base)

for asset in json.loads((root / "precache.json").read_text()):
    check(asset, root)

if missing:
    print('\n'.join(missing))
    sys.exit(1)
print(f'{checked} local asset/link references OK')
