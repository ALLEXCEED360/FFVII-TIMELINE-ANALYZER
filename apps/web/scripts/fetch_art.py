"""Download the site's official artwork and convert it to WebP (decision 0015).

Every image is official Square Enix artwork: character renders and illustrations, concept art and
key art, as hosted on the Final Fantasy Wiki (finalfantasy.fandom.com). Nothing is AI-generated.
There are no in-game screenshots, and nothing extracted from game files, with one exception the
project's owner chose: a few stills, official promo shots and a fan render of a game model,
for moments (moments/), places and groups no artwork shows as well. Credits live in
src/art/manifest.ts; this script only reproduces the files. (key/remake-title.webp, the Remake
title screen's artwork, was supplied by the project's owner and isn't fetched here.)

    python apps/web/scripts/fetch_art.py --list          # what would be fetched, with sizes
    python apps/web/scripts/fetch_art.py [cache dir]     # fetch and convert
    python apps/web/scripts/fetch_art.py --only characters/zack,characters/hojo [cache dir]

Needs Pillow. Writes WebP files to apps/web/public/art/; then run make_thumbs.py for the
network's small square versions.
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
    "characters/cait-sith": ("Cait Sith moogle from FFVII Revelation promo render.png", 1400),
    "characters/cait-sith-og": ("CaitSith-FFVIIArt.png", 1400),
    "characters/sephiroth": ("Sephiroth from FFVII Rebirth promo render.png", 1400),
    "characters/sephiroth-og": ("Sephiroth-FFVIIArt.png", 1400),
    "characters/zack": ("Zack Fair from FFVII Revelation promo render.png", 1400),
    "characters/zack-og": ("Zack FFVII Concept Art.jpg", 1400),
    "characters/president-shinra": ("President Shinra render from FFVII Remake.png", 1400),
    "characters/president-shinra-og": ("FFVII-PresidentShinra-Artwork.jpg", 1400),
    "characters/rufus": ("Rufus Shinra from Final Fantasy VII Remake render.png", 1400),
    "characters/rufus-og": ("Rufus artwork FFVII.png", 1400),
    "characters/reno": ("FF7 Remake Reno Full Body Render.png", 1400),
    "characters/reno-og": ("Reno artwork FF7.png", 1400),
    "characters/tseng": ("Tseng Final Fantasy VII Remake render.png", 1400),
    "characters/tseng-og": ("Tseng-artwork.png", 1400),
    "characters/hojo": ("Professor Hojo from FFVII Remake.png", 1400),
    "characters/hojo-og": ("Hojo FFVII Concept Art.jpg", 1400),
    "characters/jenova": ("Jenova artwork for FFVII Remake.png", 1400),
    "characters/ifalna": ("Ifalna from Final Fantasy VII Remake artwork.png", 1400),
    "characters/elmyra": ("Elmyra from Final Fantasy VII Remake artwork.png", 1400),
    "characters/elmyra-og": ("Elymra Gainsborough original artwork.png", 1400),
    "characters/jessie": ("Jessie from Final Fantasy VII Remake render.png", 1400),
    "characters/jessie-og": ("Ff7 jesse artwork.png", 1400),
    "characters/don-corneo": ("Don Corneo Final Fantasy VII Remake render.png", 1400),
    "characters/bugenhagen": ("Bugenhagen from FFVII Rebirth render.png", 1400),
    "characters/bugenhagen-og": ("FFVII - Bugenhagen Artwork.jpg", 1400),
    "characters/vincent": ("Vincent Valentine from FFVII Rebirth promo render.png", 1400),
    "characters/vincent-og": ("Vincent-FFVIIArt.png", 1400),
    "characters/cid": ("Cid Highwind from FFVII Rebirth promo render.png", 1400),
    "characters/cid-og": ("CidHighwind-FFVIIArt.png", 1400),
    "characters/rude": ("FF7 Remake Rude Full Body Render.png", 1400),
    "characters/rude-og": ("Rude Artwork.png", 1400),
    "characters/elena": ("Elena from FFVII Rebirth promo render.png", 1400),
    "characters/reeve": ("Reeve Tuesti from Final Fantasy VII Remake render.png", 1400),
    "characters/scarlet": ("Scarlet from Final Fantasy VII Remake render.png", 1400),
    "characters/biggs": ("Biggs FFVII Remake.png", 1400),
    "characters/biggs-og": ("Biggs from FFVII concept art.png", 1400),
    "characters/wedge": ("Wedge FFVII Remake.png", 1400),
    "characters/wedge-og": ("Wedge from FFVII concept art.png", 1400),
    "characters/marlene": ("Marlene Wallace from FFVII Remake render.png", 1400),
    "characters/dyne": ("Dyne from FFVII Rebirth promo render.png", 1400),
    # Places: Remake concept art for Midgar, the original's concept art beyond it.
    "places/midgar-concept": ("Midgar FFVII Concept Art.jpg", 1600),
    "places/sector-7": ("Sector 7 Pillar artwork for Final Fantasy VII Remake.png", 1600),
    "places/wall-market": ("Wall Market artwork 2 for Final Fantasy VII Remake.png", 1600),
    "places/shinra-lobby": ("Shinra HQ lobby concept art FFVII Remake.png", 1600),
    "places/hojo-lab": ("Hojo's Laboratory artwork for Final Fantasy VII Remake.png", 1600),
    "places/reactor-core": ("Mako Reactor Core artwork for FFVII Remake.png", 1600),
    "places/corneo-mansion": ("Corneo's Mansion artwork for Final Fantasy VII Remake.png", 1600),
    "places/expressway": ("Midgar Expressway artwork 3 for Final Fantasy VII Remake.png", 1600),
    "places/junon": ("Junon FFVII CG Art 1.jpg", 1600),
    "places/northern-crater": ("Northern Crater Lifestream Eruption FFVII Sketch.jpg", 1600),
    # Moments: one picture each, of where (or what) it happens.
    "places/shinra-mansion": ("DoC Shinra Mansion 1 Artwork.png", 1200),
    "places/sector-8": ("Sector 8 artwork for FFVII Remake.png", 1600),
    "places/upper-sector-7": ("Upper Sector 7 artwork for Final Fantasy VII Remake.png", 1600),
    "places/president-office": ("President-Office-Shinra-HQ-FFVIIR-Art.jpg", 1600),
    # Moments, places and groups no artwork shows: stills, Square Enix promo shots, a model render.
    "moments/second-chance-meeting": ("Second Chance Meeting from FFVII Remake.png", 1600),
    "moments/yuffie-sonon": ("FFVII Remake Intergrade promo 3.png", 1600),
    "moments/lifestream": ("Lifestream-ffvii-fmv-falling.png", 1600),
    "moments/jenova-lifeclinger": ("JENOVA Lifeclinger from FFVII Rebirth render.png", 1000),
    "moments/meteor-midgar": ("Meteor descending upon the Shinra Building from FFVII Remake.png", 1600),
    "moments/ifalna-death": ("Ifalna's death from Final Fantasy VII Remake.png", 1600),
    "moments/calamity-meteorite": ("Meteorite that destroyed the Cetra from FFVII Remake.png", 1600),
    "moments/sephiroth-black-materia": ("Sephiroth and the black materia from FFVII Rebirth.png", 1600),
    "places/midgar-remake": ("Midgar-FFVII-Remake.png", 1600),
    "places/nibelheim-rebirth": ("Nibelheim in chapter 1 from FFVII Rebirth.png", 1600),
    "places/church-remake": ("Sector 5 Church from FFVII Remake.jpg", 1600),
    "places/forgotten-capital-rebirth": ("The Forgotten Capital from FFVII Rebirth.png", 1600),
    "places/junon-rebirth": ("Junon and the Sister Ray in FFVII Rebirth.png", 1600),
    "places/temple-of-the-ancients": ("Temple of the Ancients from FFVII Rebirth.png", 1600),
    "groups/avalanche-faction": ("Avalanche Faction from FFVII Remake.png", 1600),
    "groups/wutai-troops": ("Wutai troops.png", 1600),
    "places/cosmo-canyon-torch": ("Aerith at Cosmo Canyon's Torch from FFVII Rebirth.png", 1600),
    "places/northern-crater-ending": ("NorthCrater-ffvii-ending.png", 1600),
    "groups/shinra-meeting": ("Shinra executive meeting room from FFVII Remake.jpg", 1600),
    "moments/reactor-5-trap": ("Cloud hanging in Mako Reactor 5 from FFVII Remake.png", 1600),
    "moments/scorpion-sentinel": ("Scorpion Sentinel battle artwork for FFVII Remake.png", 1600),
    "moments/aerith-altar": ("Cloud and Aerith in the ending from FFVII Rebirth.png", 1600),
    "moments/sephiroth-reborn": ("Sephiroth Reborn in edge of creation from FFVII Rebirth.png", 1600),
    "moments/nanaki-seto": ("Nanaki finds Seto from FFVII Rebirth.png", 1600),
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
    "places/shinra-mansion": (0.03, 0.625, 0.475, 0.975),
    "places/nibelheim-rebirth": (0, 0.22, 1, 1),  # the area-name banner
}
# knockout: the flat studio background around a render becomes transparent, so every character
# stands on the page the same way.
KNOCKOUT = {
    "characters/elmyra",
    "characters/jenova",
}
# sketch: pencil line art on white paper becomes light lines on transparency (the paper is keyed
# out), so it can sit on the dark page like a blueprint.
SKETCH = {
    "characters/bugenhagen-og",
    "characters/hojo-og",
    "characters/president-shinra-og",
    "characters/zack-og",
    "key/og-meteor",
    "places/northern-crater",
    "places/reactor-core",
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
    # --only a,b: just those outputs, so replacing a few pictures fetches only them.
    args = sys.argv[1:]
    only = args[args.index("--only") + 1].split(",") if "--only" in args else None
    if only:
        args = [a for a in args if a != "--only" and a != ",".join(only)]
    chosen = {k: v for k, v in ART.items() if only is None or k in only}
    titles = [title for title, _ in chosen.values()]
    info = image_info(titles)
    missing = [t for t in titles if t not in info]
    if missing:
        sys.exit(f"Not found on the wiki: {missing}")

    if "--list" in sys.argv:
        total = 0
        print("| Output | Wiki file | Original size | Download |")
        print("| --- | --- | --- | --- |")
        for key, (title, _) in chosen.items():
            i = info[title]
            total += i["size"]
            print(f"| {key}.webp | {title} | {i['width']}×{i['height']} | {i['size'] / 1024:.0f} KB |")
        print(f"\n{len(chosen)} files, {total / 1024 / 1024:.1f} MB to download.")
        return

    args = [a for a in args if a != "--list"]
    cache = Path(args[0]) if args else Path.home() / ".cache" / "ffvii-art"
    cache.mkdir(parents=True, exist_ok=True)
    sizes = {}
    for key, (title, longest) in chosen.items():
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
