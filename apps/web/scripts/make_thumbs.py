"""Make the small square pictures the network's web shows in its orbs, from public/art.

Each artwork becomes a 192px square WebP in public/thumbs, at the same path: cropped around its
focus (src/art/manifest.ts), or, for a figure, around its head and shoulders. Nothing is fetched;
rerun after fetch_art.py changes a picture.

    python apps/web/scripts/make_thumbs.py

Needs Pillow.
"""

import re
import sys
from pathlib import Path

from PIL import Image

WEB = Path(__file__).resolve().parent.parent
ART = WEB / "public" / "art"
OUT = WEB / "public" / "thumbs"
SIZE = 192


def focus_points() -> dict[str, tuple[float, float]]:
    """Each artwork's focus ("x% y%") from the manifest, where it names one."""
    source = (WEB / "src" / "art" / "manifest.ts").read_text(encoding="utf-8")
    found = {}
    for block in re.finditer(r'art\("([^"]+)",[^{]*\{(.*?)\n  \}\)', source, re.S):
        focus = re.search(r'focus: "(\d+)% (\d+)%"', block.group(2))
        if focus:
            found[block.group(1)] = (int(focus.group(1)) / 100, int(focus.group(2)) / 100)
    return found


def square(image: Image.Image, fx: float, fy: float) -> Image.Image:
    """The largest square around (fx, fy), as fractions of the image."""
    w, h = image.size
    side = min(w, h)
    left = min(max(round(fx * w - side / 2), 0), w - side)
    top = min(max(round(fy * h - side / 2), 0), h - side)
    return image.crop((left, top, left + side, top + side))


def main() -> None:
    focus = focus_points()
    made = 0
    for path in sorted(ART.rglob("*.webp")):
        key = path.relative_to(ART).with_suffix("").as_posix()
        image = Image.open(path).convert("RGBA")
        if key.startswith("characters/"):
            # A figure: the square from the top, which holds the head and shoulders.
            thumb = square(image, 0.5, 0)
        else:
            thumb = square(image, *focus.get(key, (0.5, 0.5)))
        thumb = thumb.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
        out = OUT / f"{key}.webp"
        out.parent.mkdir(parents=True, exist_ok=True)
        thumb.save(out, "WEBP", quality=80, method=6)
        made += 1
    print(f"{made} thumbnails in {OUT}")


if __name__ == "__main__":
    sys.exit(main())
