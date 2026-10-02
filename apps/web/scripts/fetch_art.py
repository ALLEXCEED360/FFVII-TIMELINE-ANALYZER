"""Download the site's official artwork and convert it to WebP (decision 0015).

Every image is official Square Enix artwork: character renders and illustrations, concept art and
key art, as hosted on the Final Fantasy Wiki (finalfantasy.fandom.com). Nothing is extracted from
game files, nothing is AI-generated, and there are no in-game screenshots. Credits live in
src/art/manifest.ts; this script only reproduces the files. (key/remake-title.webp, the Remake
title screen's artwork, was supplied by the project's owner and isn't fetched here.)

    python apps/web/scripts/fetch_art.py --list          # what would be fetched, with sizes
    python apps/web/scripts/fetch_art.py [cache dir]     # fetch and convert

Needs Pillow. Writes WebP files to apps/web/public/art/.
"""

import io
import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

OUT = Path(__file__).resolve().parent.parent / "public" / "art"
API = "https://finalfantasy.fandom.com/api.php"
AGENT = {"User-Agent": "Mozilla/5.0 (FFVII Timeline Analyzer non-commercial fan project)"}

# output path (under public/art, without extension) -> (wiki file title, longest side in px)
# Portraits keep their height; backdrops their width. Smaller originals are never upscaled.
ART: dict[str, tuple[str, int]] = {
    # Key art: title cards, the boot screen and section backdrops.
    "key/og-poster": ("FFVII Poster.png", 1400),
    "key/og-meteor": ("Meteor Logo Art.jpg", 1600),
    "key/remake": ("Final Fantasy VII Remake key art Midgar Highway.png", 2200),
    "key/intermission": ("FFVII Remake Intergrade key visual.jpg", 1920),
    "key/rebirth": ("Key Art from VIIR2 - No logo.jpg", 1600),
    "key/rebirth-party": ("Key Art from VIIR2 - September 2023 ver.jpg", 1600),
    "key/aerith": ("Aerith Key Art from FFVII Remake.jpg", 2200),
    "key/tifa": ("Tifa Lockhart from FFVII Remake key art.jpg", 1400),
    "key/barret-marlene": ("Barret and Marlene key art from FFVII Remake.jpg", 2200),
    "key/cloud-nomura": ("Cloud Strife from FFVII Remake by Tetsuya Nomura.png", 1416),
    "key/anniversary": ("FFVII 10th Anniversary Artwork.jpg", 800),
    "key/shinra-executives": ("Shin-Ra Executives Artwork.jpg", 1200),
    "key/turks": ("Turks group artwork from Final Fantasy VII.png", 1200),
    "key/world-map": ("FFVII World Map Concept Art.jpg", 1000),
    # Characters: the Remake/Rebirth look, and the original's artwork by Tetsuya Nomura.
    "characters/cloud": ("Cloud Strife from FFVII Rebirth promo render.png", 1400),
    "characters/cloud-og": ("Cloud-FFVIIArt.png", 1400),
    "characters/tifa": ("Tifa Lockhart from FFVII Remake battle render.png", 1400),
    "characters/tifa-og": ("Tifa-FFVIIArt.png", 1400),
    "characters/aerith": ("Aerith Gainsborough from FFVII Remake battle render.png", 1400),
    "characters/aerith-og": ("Aeris-FFVIIArt.png", 1400),
    "characters/barret": ("Barret Wallace from FFVII Remake sunglasses render.png", 1400),
    "characters/barret-og": ("Barret-FFVIIArt.png", 1400),
    "characters/red-xiii": ("Red XIII from FFVII Rebirth promo render.png", 1400),
    "characters/red-xiii-og": ("RedXIII-FFVIIArt.png", 1400),
    "characters/yuffie": ("Yuffie-kisaragi ff7ri--artwork.png", 1400),
    "characters/yuffie-og": ("Yuffie-FFVIIArt.png", 1400),
    "characters/cait-sith": ("Cait Sith from FFVII Rebirth promo render.png", 1400),
    "characters/cait-sith-og": ("CaitSith-FFVIIArt.png", 1400),
    "characters/sephiroth": ("Sephiroth from FFVII Rebirth promo render.png", 1400),
    "characters/sephiroth-og": ("Sephiroth-FFVIIArt.png", 1400),
    "characters/zack": ("Zack Fair from FFVII Remake render.png", 1400),
    "characters/zack-og": ("Zack FFVII Concept Art.jpg", 1400),
    "characters/president-shinra": ("President Shinra render from FFVII Remake.png", 1400),
    "characters/president-shinra-og": ("FFVII-PresidentShinra-Artwork.jpg", 1400),
    "characters/rufus": ("Rufus Shinra from Final Fantasy VII Remake render.png", 1400),
    "characters/rufus-og": ("Rufus artwork FFVII.png", 1400),
    "characters/reno": ("Reno from Final Fantasy VII Remake artwork.png", 1400),
    "characters/reno-og": ("Reno artwork FF7.png", 1400),
    "characters/tseng": ("Tseng from Final Fantasy VII Remake artwork.png", 1400),
    "characters/tseng-og": ("Tseng-artwork.png", 1400),
    "characters/hojo": ("Hojo from Final Fantasy VII Remake artwork.png", 1400),
    "characters/hojo-og": ("Hojo FFVII Concept Art.jpg", 1400),
    "characters/jenova": ("Jenova artwork for FFVII Remake.png", 1400),
    "characters/ifalna": ("Ifalna from Final Fantasy VII Remake artwork.png", 1400),
    "characters/elmyra": ("Elmyra from Final Fantasy VII Remake artwork.png", 1400),
    "characters/elmyra-og": ("Elymra Gainsborough original artwork.png", 1400),
    "characters/jessie": ("Jessie-FFVIIR-Roberto-Ferrari.png", 1400),
    "characters/jessie-og": ("Ff7 jesse artwork.png", 1400),
    "characters/don-corneo": ("Don Corneo artwork for FFVII Remake.png", 1400),
    "characters/bugenhagen": ("Bugenhagen from FFVII Rebirth render.png", 1400),
    "characters/bugenhagen-og": ("FFVII - Bugenhagen Artwork.jpg", 1400),
    # Places: Remake concept art for Midgar, the original's concept art beyond it.
    "places/midgar": ("Midgar City FFVII Art.png", 1600),
    "places/midgar-concept": ("Midgar FFVII Concept Art.jpg", 1600),
    "places/sector-7": ("Sector 7 Pillar artwork for Final Fantasy VII Remake.png", 1600),
    "places/sector-5-church": ("Sector 5 Church artwork for FFVII Remake.png", 1400),
    "places/wall-market": ("Wall Market artwork 2 for Final Fantasy VII Remake.png", 1600),
    "places/shinra-lobby": ("Shinra HQ lobby concept art FFVII Remake.png", 1600),
    "places/hojo-lab": ("Hojo's Laboratory artwork for Final Fantasy VII Remake.png", 1600),
    "places/reactor-1": ("Mako Reactor 1 interior artwork for FFVII Remake.png", 1600),
    "places/reactor-core": ("Mako Reactor Core artwork for FFVII Remake.png", 1600),
    "places/corneo-mansion": ("Corneo's Mansion artwork for Final Fantasy VII Remake.png", 1600),
    "places/expressway": ("Midgar Expressway artwork 3 for Final Fantasy VII Remake.png", 1600),
    "places/seventh-heaven": ("Seventh Heaven artwork for Final Fantasy VII Remake.png", 1600),
    "places/aerith-house": ("Aeriths-House-Artwork-FFVIIR.png", 1600),
    "places/junon": ("Junon FFVII CG Art 1.jpg", 1600),
    "places/cosmo-canyon": ("Cosmo Canyon Early FFVII Art.jpg", 1600),
    "places/nibelheim": ("Nibelheim FF7 Art 3.jpg", 1600),
    "places/nibel-reactor": ("Nibel Reactor Jenova Room FFVII Sketch.jpg", 1400),
    "places/forgotten-capital": ("Forgotten Capital FF7 Art 1.jpg", 1600),
    "places/northern-crater": ("Northern Crater Lifestream Eruption FFVII Sketch.jpg", 1600),
    "places/seto": ("Seto Artwork.jpg", 1200),
}


def query(**params) -> dict:
    params["format"] = "json"
    request = urllib.request.Request(f"{API}?{urllib.parse.urlencode(params)}", headers=AGENT)
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def image_info(titles: list[str]) -> dict[str, dict]:
    """File title -> {url, width, height, size, descriptionurl}."""
    info: dict[str, dict] = {}
    for i in range(0, len(titles), 40):
        batch = [f"File:{t}" for t in titles[i : i + 40]]
        data = query(action="query", titles="|".join(batch), prop="imageinfo", iiprop="url|size")
        normalized = {n["to"]: n["from"] for n in data["query"].get("normalized", [])}
        for page in data["query"]["pages"].values():
            title = normalized.get(page["title"], page["title"]).removeprefix("File:")
            if "imageinfo" in page:
                info[title] = page["imageinfo"][0]
    return info


def fetch(url: str, cache: Path) -> bytes:
    name = urllib.parse.unquote(url.split("/revision")[0].rsplit("/", 1)[-1])
    path = cache / name
    if not path.exists():
        with urllib.request.urlopen(urllib.request.Request(url, headers=AGENT), timeout=120) as r:
            path.write_bytes(r.read())
    return path.read_bytes()


# Treatments, applied before resizing. Colour and drawing are never altered beyond these.
# crop: (left, top, right, bottom) as fractions — trims printed titles and publisher logos.
CROP = {
    "key/cloud-nomura": (0, 0, 1, 0.66),  # "Welcome back to Midgar" and the logo
    "key/og-poster": (0, 0, 1, 0.94),  # the publisher's logos
}
# knockout: the flat studio background around a render becomes transparent, so every character
# stands on the page the same way.
KNOCKOUT = {
    "characters/elmyra",
    "characters/jessie",
    "characters/reno",
    "characters/tseng",
    "characters/hojo",
    "characters/don-corneo",
    "characters/jenova",
    "places/sector-5-church",
}
# sketch: pencil line art on white paper becomes light lines on transparency (the paper is keyed
# out), so it can sit on the dark page like a blueprint.
SKETCH = {
    "characters/bugenhagen-og",
    "characters/hojo-og",
    "characters/president-shinra-og",
    "characters/zack-og",
    "key/og-meteor",
    "key/shinra-executives",
    "places/midgar",
    "places/forgotten-capital",
    "places/nibel-reactor",
    "places/nibelheim",
    "places/northern-crater",
    "places/reactor-1",
    "places/reactor-core",
    "places/seto",
}


def knockout(image, tolerance: int = 22):
    """Flood the background from the edges and make it transparent."""
    from PIL import Image, ImageChops, ImageDraw, ImageFilter

    rgb = image.convert("RGB")
    w, h = rgb.size
    marker = (255, 0, 255)
    filled = rgb.copy()
    seeds = [(x, y) for x in (0, w // 2, w - 1) for y in (0, h // 2, h - 1) if (x, y) != (w // 2, h // 2)]
    for seed in seeds:
        if filled.getpixel(seed) != marker:
            ImageDraw.floodfill(filled, seed, marker, thresh=tolerance)
    diff = ImageChops.difference(filled, Image.new("RGB", (w, h), marker)).convert("L")
    mask = diff.point(lambda v: 0 if v < 8 else 255).filter(ImageFilter.GaussianBlur(0.8))
    alpha = image.getchannel("A") if image.mode == "RGBA" else Image.new("L", (w, h), 255)
    out = rgb.convert("RGBA")
    out.putalpha(ImageChops.multiply(alpha, mask))
    return out


def sketch(image):
    """Key out the paper: ink density becomes alpha, drawn in warm white."""
    from PIL import Image, ImageOps

    gray = ImageOps.autocontrast(image.convert("L"), cutoff=1)
    # The paper's tone is what most of the page is: scans range from white to mid grey.
    histogram = gray.histogram()
    total, seen, paper = sum(histogram), 0, 255
    for level in range(255, -1, -1):
        seen += histogram[level]
        if seen >= total * 0.4:
            paper = level
            break
    # Paper (and anything lighter) → transparent; lines → opaque, keeping pencil shading.
    floor = paper - 14
    alpha = gray.point(lambda v: max(0, min(255, round((floor - v) * 255 / max(floor * 0.8, 1)))))
    out = Image.new("RGBA", image.size, (242, 234, 217, 0))
    out.putalpha(alpha)
    return out


def convert(key: str, data: bytes, longest: int) -> tuple[bytes, int, int]:
    from PIL import Image

    image = Image.open(io.BytesIO(data))
    image = image.convert("RGBA" if image.mode in ("RGBA", "LA", "P") else "RGB")
    if key in CROP:
        left, top, right, bottom = CROP[key]
        w, h = image.size
        image = image.crop((round(left * w), round(top * h), round(right * w), round(bottom * h)))
    if key in KNOCKOUT:
        image = knockout(image)
    if key in SKETCH:
        image = sketch(image)
    scale = min(1.0, longest / max(image.size))
    if scale < 1:
        size = (round(image.width * scale), round(image.height * scale))
        image = image.resize(size, Image.Resampling.LANCZOS)
    out = io.BytesIO()
    image.save(out, "WEBP", quality=82, method=6)
    return out.getvalue(), image.width, image.height


def main() -> None:
    titles = [title for title, _ in ART.values()]
    info = image_info(titles)
    missing = [t for t in titles if t not in info]
    if missing:
        sys.exit(f"Not found on the wiki: {missing}")

    if "--list" in sys.argv:
        total = 0
        print("| Output | Wiki file | Original size | Download |")
        print("| --- | --- | --- | --- |")
        for key, (title, _) in ART.items():
            i = info[title]
            total += i["size"]
            print(f"| {key}.webp | {title} | {i['width']}×{i['height']} | {i['size'] / 1024:.0f} KB |")
        print(f"\n{len(ART)} files, {total / 1024 / 1024:.1f} MB to download.")
        return

    cache = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / ".cache" / "ffvii-art"
    cache.mkdir(parents=True, exist_ok=True)
    sizes = {}
    for key, (title, longest) in ART.items():
        webp, width, height = convert(key, fetch(info[title]["url"], cache), longest)
        path = OUT / f"{key}.webp"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(webp)
        sizes[key] = (width, height)
        print(f"{key}.webp  {width}×{height}  {len(webp) / 1024:.0f} KB")
    # The manifest records each image's size so the page can reserve its space.
    (cache / "sizes.json").write_text(json.dumps(sizes, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
