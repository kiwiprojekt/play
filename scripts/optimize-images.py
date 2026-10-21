"""Convert artwork to bounded WebP assets. Requires Pillow; run on new PNG sources.
References are updated by the caller after reviewing the converted artwork.
"""
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
files = [p for p in root.rglob('*.png')
         if 'node_modules' not in p.parts and not p.name.startswith('icon-')]
before = after = 0
for path in files:
    limit = 1600 if path.stem in ('bg', 'bg1') else 640
    with Image.open(path) as image:
        image = ImageOps.exif_transpose(image)
        image.thumbnail((limit, limit), Image.Resampling.LANCZOS)
        target = path.with_suffix('.webp')
        image.save(target, 'WEBP', quality=83, method=6)
    before += path.stat().st_size
    after += target.stat().st_size
print(f'{len(files)} images: {before:,} → {after:,} bytes ({(1-after/before)*100:.1f}% smaller)' if before else 'No PNG sources to convert.')
