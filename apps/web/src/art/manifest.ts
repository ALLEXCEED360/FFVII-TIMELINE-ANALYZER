import type { TitleCode } from "../api/client";

// Every image the site shows: official Square Enix art from the Final Fantasy Wiki, converted by
// scripts/fetch_art.py and credited on /credits. Decoration only; never AI-made.

export interface ArtEntry {
  /** Its path under public/art, without extension: "characters/cloud". */
  id: string;
  width: number;
  height: number;
  /** Describes the image for screen readers. */
  alt: string;
  /** key: a full illustration. cutout: a figure on transparency. scene: a place. lineart: a sketch. */
  kind: "key" | "cutout" | "scene" | "lineart";
  /** Where to centre it when the layout crops it (CSS object-position). */
  focus?: string;
  /** Entities it depicts or evokes, so their pages can use it. */
  subjects: readonly string[];
  /** For a character's pair of images: the original's artwork, or the Remake/Rebirth look. */
  era?: "og" | "modern";
  /** What it is, for the Credits page. */
  title: string;
  /** The artist, where the source names one; otherwise the studio. */
  artist: string;
  /** The file's name on the Final Fantasy Wiki, where it came from there. */
  wiki?: string;
  /** Where it came from otherwise. */
  source?: string;
}

const SE = "Square Enix";
const NOMURA = "Tetsuya Nomura";

function art(
  id: string,
  size: string,
  kind: ArtEntry["kind"],
  entry: Omit<ArtEntry, "id" | "width" | "height" | "kind" | "subjects" | "artist"> &
    Partial<Pick<ArtEntry, "subjects" | "artist">>,
): ArtEntry {
  const [width = 0, height = 0] = size.split("x").map(Number);
  return { id, width, height, kind, subjects: [], artist: SE, ...entry };
}

export const ARTWORK: readonly ArtEntry[] = [
  // ── Key art ─────────────────────────────────────────────────────────────────────────────────
  art("key/og-poster", "650x916", "key", {
    alt: "The original Final Fantasy VII party in a crowded poster: Cloud with the Buster Sword at the centre, Aerith, Vincent, Yuffie, Barret, Tifa, Red XIII and Cait Sith around him, under a red Shinra emblem.",
    focus: "50% 30%",
    title: "Final Fantasy VII poster (1997)",
    artist: NOMURA,
    wiki: "FFVII Poster.png",
  }),
  art("key/og-meteor", "1446x940", "lineart", {
    alt: "Yoshitaka Amano's Meteor: a great sphere trailing a tail of streaks, with a small moon beside it.",
    title: "Meteor logo artwork, shown as light on dark",
    artist: "Yoshitaka Amano",
    wiki: "Meteor Logo Art.jpg",
  }),
  art("key/remake", "2200x947", "key", {
    alt: "Red XIII, Aerith, Cloud on his motorbike, Barret and Tifa on the broken end of a highway at dusk, Midgar's towers behind them.",
    focus: "60% 50%",
    title: "Final Fantasy VII Remake key art (Midgar Highway)",
    wiki: "Final Fantasy VII Remake key art Midgar Highway.png",
  }),
  art("key/intermission", "1920x1080", "key", {
    alt: "Tifa, Barret, Cloud on his motorbike, Aerith and Red XIII, seen from behind on a rooftop, looking out over the cranes beyond Midgar at sunrise.",
    focus: "55% 50%",
    title: "Final Fantasy VII Remake Intergrade key visual",
    wiki: "FFVII Remake Intergrade key visual.jpg",
  }),
  art("key/rebirth", "1200x1500", "key", {
    alt: "Cloud and Zack standing either side of a distant Sephiroth in shallow water, beneath a blazing red sky between rock spires.",
    focus: "50% 45%",
    title: "Final Fantasy VII Rebirth key art",
    wiki: "Key Art from VIIR2 - No logo.jpg",
  }),
  art("key/rebirth-party", "1200x1600", "key", {
    alt: "Tifa and Aerith standing either side of a distant Sephiroth in shallow water, beneath a blazing red sky between rock spires.",
    focus: "50% 45%",
    title: "Final Fantasy VII Rebirth key art (September 2023)",
    wiki: "Key Art from VIIR2 - September 2023 ver.jpg",
  }),
  art("key/aerith", "2200x1724", "key", {
    alt: "Aerith, seen from behind, standing on an open road under a wide blue sky with clouds.",
    focus: "35% 50%",
    subjects: ["character_aerith_gainsborough"],
    title: "Aerith key art from Final Fantasy VII Remake",
    wiki: "Aerith Key Art from FFVII Remake.jpg",
  }),
  art("key/tifa", "1000x752", "key", {
    alt: "Tifa sitting on top of Nibelheim's water tower under a starry night sky.",
    focus: "50% 55%",
    subjects: ["character_tifa_lockhart"],
    title: "Tifa key art from Final Fantasy VII Remake",
    wiki: "Tifa Lockhart from FFVII Remake key art.jpg",
  }),
  art("key/barret-marlene", "2200x1652", "key", {
    alt: "Barret, seen from behind with Marlene on his shoulders, facing the flowers in the ruined Sector 5 church.",
    focus: "40% 50%",
    subjects: ["character_barret_wallace", "organization_avalanche"],
    title: "Barret and Marlene key art from Final Fantasy VII Remake",
    wiki: "Barret and Marlene key art from FFVII Remake.jpg",
  }),
  art("key/cloud-nomura", "1000x935", "key", {
    alt: "Cloud in close-up, one arm raised behind his head, the Buster Sword's hilt over his shoulder.",
    focus: "50% 30%",
    subjects: ["character_cloud_strife"],
    title: "Cloud Strife illustration for Final Fantasy VII Remake",
    artist: NOMURA,
    wiki: "Cloud Strife from FFVII Remake by Tetsuya Nomura.png",
  }),
  art("key/anniversary", "462x554", "key", {
    alt: "Sephiroth, Zack and Cloud in profile, one behind the other, in Nomura's ink-and-colour style.",
    subjects: ["organization_soldier"],
    title: "Final Fantasy VII 10th anniversary artwork",
    artist: NOMURA,
    wiki: "FFVII 10th Anniversary Artwork.jpg",
  }),
  art("key/turks", "925x725", "cutout", {
    alt: "The Turks standing in a line in their dark suits — Elena, Tseng, Rude and Reno — with Rufus Shinra in white at the centre.",
    subjects: ["organization_turks"],
    title: "The Turks group artwork",
    wiki: "Turks group artwork from Final Fantasy VII.png",
  }),
  art("key/world-map", "628x498", "key", {
    alt: "An early hand-drawn map of the Planet's continents, labelled in Japanese.",
    title: "World map concept art",
    wiki: "FFVII World Map Concept Art.jpg",
  }),

  // ── Characters: the Remake/Rebirth look, and the original's artwork ────────────────────────
  art("characters/cloud", "451x1080", "cutout", {
    alt: "Cloud in his Remake look, the Buster Sword resting on his shoulder.",
    subjects: ["character_cloud_strife"],
    era: "modern",
    title: "Cloud Strife, Final Fantasy VII Rebirth render",
    wiki: "Cloud Strife from FFVII Rebirth promo render.png",
  }),
  art("characters/cloud-og", "1024x1238", "cutout", {
    alt: "Cloud in the original's artwork, holding the Buster Sword out to one side.",
    subjects: ["character_cloud_strife"],
    era: "og",
    title: "Cloud Strife, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Cloud-FFVIIArt.png",
  }),
  art("characters/tifa", "788x1400", "cutout", {
    alt: "Tifa in her Remake look, fists raised in her fighting stance.",
    subjects: ["character_tifa_lockhart"],
    era: "modern",
    title: "Tifa Lockhart, Final Fantasy VII Remake render",
    wiki: "Tifa Lockhart from FFVII Remake battle render.png",
  }),
  art("characters/tifa-og", "597x1251", "cutout", {
    alt: "Tifa in the original's artwork, in her white top and gloves.",
    subjects: ["character_tifa_lockhart"],
    era: "og",
    title: "Tifa Lockhart, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Tifa-FFVIIArt.png",
  }),
  art("characters/aerith", "890x1400", "cutout", {
    alt: "Aerith in her Remake look, holding her staff in both hands.",
    subjects: ["character_aerith_gainsborough"],
    era: "modern",
    title: "Aerith Gainsborough, Final Fantasy VII Remake render",
    wiki: "Aerith Gainsborough from FFVII Remake battle render.png",
  }),
  art("characters/aerith-og", "852x1304", "cutout", {
    alt: "Aerith in the original's artwork, in her pink dress, holding her staff.",
    subjects: ["character_aerith_gainsborough"],
    era: "og",
    title: "Aeris Gainsborough, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Aeris-FFVIIArt.png",
  }),
  art("characters/barret", "671x1239", "cutout", {
    alt: "Barret in his Remake look, wearing sunglasses, his gun-arm at his side.",
    subjects: ["character_barret_wallace"],
    era: "modern",
    title: "Barret Wallace, Final Fantasy VII Remake render",
    wiki: "Barret Wallace from FFVII Remake sunglasses render.png",
  }),
  art("characters/barret-og", "1011x1140", "cutout", {
    alt: "Barret in the original's artwork, planted wide with his gun-arm.",
    subjects: ["character_barret_wallace"],
    era: "og",
    title: "Barret Wallace, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Barret-FFVIIArt.png",
  }),
  art("characters/red-xiii", "937x665", "cutout", {
    alt: "Red XIII in his Rebirth look, prowling low, his flame-tipped tail raised.",
    subjects: ["character_red_xiii"],
    era: "modern",
    title: "Red XIII, Final Fantasy VII Rebirth render",
    wiki: "Red XIII from FFVII Rebirth promo render.png",
  }),
  art("characters/red-xiii-og", "404x222", "cutout", {
    alt: "Red XIII in the original's artwork, mid-stride.",
    subjects: ["character_red_xiii"],
    era: "og",
    title: "Red XIII, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "RedXIII-FFVIIArt.png",
  }),
  art("characters/yuffie", "1032x1400", "cutout", {
    alt: "Yuffie in her INTERmission look, her giant shuriken held behind her.",
    subjects: ["character_yuffie"],
    era: "modern",
    title: "Yuffie Kisaragi, Final Fantasy VII Remake INTERmission artwork",
    wiki: "Yuffie-kisaragi ff7ri--artwork.png",
  }),
  art("characters/yuffie-og", "804x1351", "cutout", {
    alt: "Yuffie in the original's artwork, holding her shuriken overhead.",
    subjects: ["character_yuffie"],
    era: "og",
    title: "Yuffie Kisaragi, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Yuffie-FFVIIArt.png",
  }),
  art("characters/cait-sith", "1112x1400", "cutout", {
    alt: "Cait Sith in his Remake Trilogy look, crown on his head and megaphone raised, riding his great white moogle.",
    subjects: ["character_cait_sith"],
    era: "modern",
    title: "Cait Sith and his moogle, Final Fantasy VII Revelation render",
    wiki: "Cait Sith moogle from FFVII Revelation promo render.png",
  }),
  art("characters/cait-sith-og", "992x1173", "cutout", {
    alt: "Cait Sith in the original's artwork, riding his great white moogle.",
    subjects: ["character_cait_sith"],
    era: "og",
    title: "Cait Sith, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "CaitSith-FFVIIArt.png",
  }),
  art("characters/sephiroth", "511x853", "cutout", {
    alt: "Sephiroth in his Rebirth look, the Masamune held low at his side.",
    subjects: ["character_sephiroth"],
    era: "modern",
    title: "Sephiroth, Final Fantasy VII Rebirth render",
    wiki: "Sephiroth from FFVII Rebirth promo render.png",
  }),
  art("characters/sephiroth-og", "1400x1000", "cutout", {
    alt: "Sephiroth in the original's artwork, the Masamune's long blade sweeping out behind him.",
    subjects: ["character_sephiroth"],
    era: "og",
    title: "Sephiroth, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Sephiroth-FFVIIArt.png",
  }),
  art("characters/zack", "603x1400", "cutout", {
    alt: "Zack in his Remake Trilogy look, standing in his SOLDIER uniform, the Buster Sword on his back.",
    subjects: ["character_zack_fair"],
    era: "modern",
    title: "Zack Fair, Final Fantasy VII Revelation render",
    wiki: "Zack Fair from FFVII Revelation promo render.png",
  }),
  art("characters/zack-og", "365x561", "lineart", {
    alt: "A pencil sketch of Zack in SOLDIER uniform, sword on his back, with notes in Japanese.",
    subjects: ["character_zack_fair"],
    era: "og",
    title: "Zack concept sketch, Final Fantasy VII",
    artist: NOMURA,
    wiki: "Zack FFVII Concept Art.jpg",
  }),
  art("characters/president-shinra", "386x1172", "cutout", {
    alt: "President Shinra in his Remake look, in a dark double-breasted suit.",
    subjects: ["character_president_shinra"],
    era: "modern",
    title: "President Shinra, Final Fantasy VII Remake render",
    wiki: "President Shinra render from FFVII Remake.png",
  }),
  art("characters/president-shinra-og", "390x800", "lineart", {
    alt: "A line drawing of President Shinra, one finger raised as he speaks.",
    subjects: ["character_president_shinra"],
    era: "og",
    title: "President Shinra, Final Fantasy VII artwork",
    wiki: "FFVII-PresidentShinra-Artwork.jpg",
  }),
  art("characters/rufus", "362x1132", "cutout", {
    alt: "Rufus Shinra in his Remake look, in his long white coat.",
    subjects: ["character_rufus_shinra"],
    era: "modern",
    title: "Rufus Shinra, Final Fantasy VII Remake render",
    wiki: "Rufus Shinra from Final Fantasy VII Remake render.png",
  }),
  art("characters/rufus-og", "655x1245", "cutout", {
    alt: "Rufus Shinra in the original's artwork, in white, a shotgun at his side.",
    subjects: ["character_rufus_shinra"],
    era: "og",
    title: "Rufus Shinra, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Rufus artwork FFVII.png",
  }),
  art("characters/reno", "371x1286", "cutout", {
    alt: "Reno in his Remake look, in an open black suit jacket, goggles pushed up into his red hair.",
    subjects: ["character_reno"],
    era: "modern",
    title: "Reno, Final Fantasy VII Remake render",
    wiki: "FF7 Remake Reno Full Body Render.png",
  }),
  art("characters/reno-og", "441x1255", "cutout", {
    alt: "Reno in the original's artwork, his red hair tied back, rod in hand.",
    subjects: ["character_reno"],
    era: "og",
    title: "Reno, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Reno artwork FF7.png",
  }),
  art("characters/tseng", "249x820", "cutout", {
    alt: "Tseng in his Remake look, standing straight in a dark suit and tie.",
    subjects: ["character_tseng"],
    era: "modern",
    title: "Tseng, Final Fantasy VII Remake render",
    wiki: "Tseng Final Fantasy VII Remake render.png",
  }),
  art("characters/tseng-og", "250x657", "cutout", {
    alt: "Tseng in the original's artwork, in his dark blue suit.",
    subjects: ["character_tseng"],
    era: "og",
    title: "Tseng, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Tseng-artwork.png",
  }),
  art("characters/hojo", "462x1204", "cutout", {
    alt: "Hojo in his Remake look, in a white lab coat, one hand behind his head.",
    subjects: ["character_hojo"],
    era: "modern",
    title: "Professor Hojo, Final Fantasy VII Remake render",
    wiki: "Professor Hojo from FFVII Remake.png",
  }),
  art("characters/hojo-og", "214x532", "lineart", {
    alt: "A pencil sketch of Hojo from the side, hair tied back, glasses on.",
    subjects: ["character_hojo"],
    era: "og",
    title: "Hojo concept sketch, Final Fantasy VII",
    wiki: "Hojo FFVII Concept Art.jpg",
  }),
  art("characters/jenova", "360x1001", "cutout", {
    alt: "Jenova's headless specimen body, bound in tubes and machinery above a great fleshy mass.",
    subjects: ["character_jenova"],
    era: "modern",
    title: "Jenova, Final Fantasy VII Remake artwork",
    wiki: "Jenova artwork for FFVII Remake.png",
  }),
  art("characters/ifalna", "355x1007", "cutout", {
    alt: "Ifalna in her Remake look, in a long dark red dress, her hair loose.",
    subjects: ["character_ifalna"],
    era: "modern",
    title: "Ifalna, Final Fantasy VII Remake artwork",
    wiki: "Ifalna from Final Fantasy VII Remake artwork.png",
  }),
  art("characters/elmyra", "455x1023", "cutout", {
    alt: "Elmyra in her Remake look, hands on hips, in a green dress and cream apron.",
    subjects: ["character_elmyra_gainsborough"],
    era: "modern",
    title: "Elmyra Gainsborough, Final Fantasy VII Remake artwork",
    wiki: "Elmyra from Final Fantasy VII Remake artwork.png",
  }),
  art("characters/elmyra-og", "402x549", "cutout", {
    alt: "Elmyra in the original's artwork, holding a broom, in a green dress and apron.",
    subjects: ["character_elmyra_gainsborough"],
    era: "og",
    title: "Elmyra Gainsborough, Final Fantasy VII artwork",
    wiki: "Elymra Gainsborough original artwork.png",
  }),
  art("characters/jessie", "406x1199", "cutout", {
    alt: "Jessie in her Remake look, in light armour and a red headband, hand on her hip.",
    subjects: ["character_jessie"],
    era: "modern",
    title: "Jessie Rasberry, Final Fantasy VII Remake render",
    wiki: "Jessie from Final Fantasy VII Remake render.png",
  }),
  art("characters/jessie-og", "439x953", "cutout", {
    alt: "Jessie in the original's artwork, waving, in armour and a red headband.",
    subjects: ["character_jessie"],
    era: "og",
    title: "Jessie, Final Fantasy VII artwork",
    wiki: "Ff7 jesse artwork.png",
  }),
  art("characters/don-corneo", "624x1068", "cutout", {
    alt: "Don Corneo in his Remake look, in a fur-collared red coat, arms held wide.",
    subjects: ["character_don_corneo", "event_corneo_audition"],
    era: "modern",
    title: "Don Corneo, Final Fantasy VII Remake render",
    wiki: "Don Corneo Final Fantasy VII Remake render.png",
  }),
  art("characters/bugenhagen", "295x762", "cutout", {
    alt: "Bugenhagen in his Rebirth look, floating on a glowing green orb, in long dark robes.",
    subjects: ["character_bugenhagen"],
    era: "modern",
    title: "Bugenhagen, Final Fantasy VII Rebirth render",
    wiki: "Bugenhagen from FFVII Rebirth render.png",
  }),
  art("characters/bugenhagen-og", "262x556", "lineart", {
    alt: "A line drawing of Bugenhagen floating on his orb, his beard tied in a knot.",
    subjects: ["character_bugenhagen"],
    era: "og",
    title: "Bugenhagen, Final Fantasy VII artwork",
    wiki: "FFVII - Bugenhagen Artwork.jpg",
  }),

  // ── Places ──────────────────────────────────────────────────────────────────────────────────
  art("places/midgar-concept", "1379x1062", "scene", {
    alt: "Midgar at night from above: the round city on its plate, reactors venting green light around the Shinra Building at its heart.",
    focus: "50% 45%",
    subjects: ["location_midgar"],
    title: "Midgar concept art, Final Fantasy VII",
    wiki: "Midgar FFVII Concept Art.jpg",
  }),
  art("places/sector-7", "1260x755", "scene", {
    alt: "The Sector 7 slums beneath the plate, lit by lamps and wires, the support pillar towering over them.",
    focus: "40% 50%",
    subjects: ["location_sector_7"],
    title: "Sector 7 pillar concept art, Final Fantasy VII Remake",
    wiki: "Sector 7 Pillar artwork for Final Fantasy VII Remake.png",
  }),
  art("places/wall-market", "1002x608", "scene", {
    alt: "Wall Market at night: crowded lanterns and neon signs in a deep street under the plate.",
    subjects: ["location_wall_market"],
    title: "Wall Market concept art, Final Fantasy VII Remake",
    wiki: "Wall Market artwork 2 for Final Fantasy VII Remake.png",
  }),
  art("places/shinra-lobby", "1600x968", "scene", {
    alt: "The Shinra Building's lobby: a tall atrium of steel and glass, banners hanging, displays glowing.",
    subjects: ["location_shinra_building"],
    title: "Shinra HQ lobby concept art, Final Fantasy VII Remake",
    wiki: "Shinra HQ lobby concept art FFVII Remake.png",
  }),
  art("places/hojo-lab", "1300x730", "scene", {
    alt: "Hojo's laboratory: tall specimen tanks glowing green in a dark, cluttered room.",
    title: "Hojo's laboratory concept art, Final Fantasy VII Remake",
    wiki: "Hojo's Laboratory artwork for Final Fantasy VII Remake.png",
  }),
  art("places/reactor-core", "1200x955", "lineart", {
    alt: "A line drawing of a Mako reactor's core: pipes converging on a great cylinder.",
    title: "Mako reactor core concept art, Final Fantasy VII Remake",
    wiki: "Mako Reactor Core artwork for FFVII Remake.png",
  }),
  art("places/corneo-mansion", "1002x543", "scene", {
    alt: "Don Corneo's mansion at night, its tiered red-lit roofs rising over Wall Market.",
    title: "Corneo's mansion concept art, Final Fantasy VII Remake",
    wiki: "Corneo's Mansion artwork for Final Fantasy VII Remake.png",
  }),
  art("places/expressway", "884x505", "scene", {
    alt: "Cloud on his motorbike speeding down a dark elevated expressway.",
    title: "Midgar expressway concept art, Final Fantasy VII Remake",
    wiki: "Midgar Expressway artwork 3 for Final Fantasy VII Remake.png",
  }),
  art("places/junon", "1403x1053", "scene", {
    alt: "Junon at dusk: the great cannon jutting out over the sea from its fortified cliff.",
    subjects: ["location_junon"],
    title: "Junon CG artwork, Final Fantasy VII",
    wiki: "Junon FFVII CG Art 1.jpg",
  }),
  art("places/northern-crater", "1144x798", "lineart", {
    alt: "A sketch of the Northern Crater with the Lifestream erupting upward from its heart.",
    subjects: ["location_northern_crater"],
    title: "Northern Crater Lifestream sketch, Final Fantasy VII",
    wiki: "Northern Crater Lifestream Eruption FFVII Sketch.jpg",
  }),
  art("places/shinra-mansion", "218x143", "scene", {
    alt: "The Shinra Mansion's ruined hall in teal shadow, light falling through three tall windows above a staircase.",
    title: "Shinra Mansion concept art, Dirge of Cerberus -Final Fantasy VII-",
    wiki: "DoC Shinra Mansion 1 Artwork.png",
  }),
  art("places/sector-8", "1300x700", "scene", {
    alt: "Sector 8 just after the bombing: fires burning in the dark street beneath the reactor's towers.",
    title: "Sector 8 concept art, Final Fantasy VII Remake",
    wiki: "Sector 8 artwork for FFVII Remake.png",
  }),
  art("places/upper-sector-7", "689x352", "scene", {
    alt: "A wet street on the upper plate of Sector 7 at night, lit by lamps and a glowing billboard.",
    title: "Upper Sector 7 concept art, Final Fantasy VII Remake",
    wiki: "Upper Sector 7 artwork for Final Fantasy VII Remake.png",
  }),
  art("places/president-office", "1200x710", "scene", {
    alt: "President Shinra's office: a long red carpet between lit columns, leading to his desk.",
    title: "President's office concept art, Final Fantasy VII Remake",
    wiki: "President-Office-Shinra-HQ-FFVIIR-Art.jpg",
  }),
  // ── Moments no artwork shows: stills, Square Enix promo shots and a model render ───────────
  art("moments/second-chance-meeting", "1600x901", "scene", {
    alt: "Aerith standing over Cloud among the white and yellow flowers of the Sector 5 church, where he has fallen through the roof.",
    focus: "35% 50%",
    title: "Aerith and Cloud in the church, Final Fantasy VII Remake (in-game still)",
    wiki: "Second Chance Meeting from FFVII Remake.png",
  }),
  art("moments/yuffie-sonon", "1600x900", "scene", {
    alt: "Yuffie and Sonon back to back inside the Shinra Building, weapons ready.",
    focus: "45% 40%",
    title: "Yuffie and Sonon, Final Fantasy VII Remake Intergrade (Square Enix promo screenshot)",
    wiki: "FFVII Remake Intergrade promo 3.png",
  }),
  art("moments/jenova-lifeclinger", "1000x979", "cutout", {
    alt: "JENOVA Lifeclinger: a mass of violet, feather-like tendrils spreading from a skeletal body.",
    title: "JENOVA Lifeclinger, Final Fantasy VII Rebirth (render of the game's model)",
    artist: "Yare Yare Dong (render of the game's model)",
    wiki: "JENOVA Lifeclinger from FFVII Rebirth render.png",
  }),
  art("moments/ifalna-death", "1600x900", "scene", {
    alt: "Ifalna lying dying at a Midgar station in the rain-dim light, young Aerith beside her as Elmyra comes near.",
    focus: "50% 55%",
    title: "Ifalna's death, Final Fantasy VII Remake (in-game still)",
    wiki: "Ifalna's death from Final Fantasy VII Remake.png",
  }),
  art("moments/calamity-meteorite", "1600x900", "scene", {
    alt: "A blazing meteorite streaking across a starry sky over the clouds, watched from a high peak.",
    focus: "60% 35%",
    title: "The meteorite that brought Jenova, Final Fantasy VII Remake (in-game still)",
    wiki: "Meteorite that destroyed the Cetra from FFVII Remake.png",
  }),
  art("moments/sephiroth-black-materia", "1600x898", "scene", {
    alt: "Sephiroth holding the black materia aloft on a stone causeway in the Temple of the Ancients, Cloud and the party behind him.",
    focus: "45% 40%",
    title: "Sephiroth holds the black materia, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Sephiroth and the black materia from FFVII Rebirth.png",
  }),
  // ── Places and groups no artwork shows ─────────────────────────────────────────────────────
  art("places/midgar-remake", "1600x678", "scene", {
    alt: "Midgar's upper plate: expressways and pipes winding between tall towers in a pale haze.",
    title: "Midgar, Final Fantasy VII Remake (trailer still)",
    wiki: "Midgar-FFVII-Remake.png",
  }),
  art("places/nibelheim-rebirth", "1600x703", "scene", {
    alt: "Nibelheim's square at dusk: timbered houses, the water tower and the stairs up to the Shinra Mansion.",
    title: "Nibelheim, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Nibelheim in chapter 1 from FFVII Rebirth.png",
  }),
  art("places/cosmo-canyon-torch", "1600x900", "scene", {
    alt: "Aerith at the great torch of Cosmo Canyon at night, robed elders with lanterns on either side.",
    focus: "50% 40%",
    title: "The torch of Cosmo Canyon, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Aerith at Cosmo Canyon's Torch from FFVII Rebirth.png",
  }),
  art("places/northern-crater-ending", "500x238", "scene", {
    alt: "The Northern Crater in the dark, the Lifestream rising from it in pale green columns.",
    title: "The Northern Crater, Final Fantasy VII (frame from the game's movie)",
    wiki: "NorthCrater-ffvii-ending.png",
  }),
  art("places/church-remake", "1600x900", "scene", {
    alt: "Inside the Sector 5 church: light falling through tall windows onto Aerith's flower bed among broken pews.",
    focus: "55% 55%",
    title: "The Sector 5 church, Final Fantasy VII Remake (screenshot)",
    wiki: "Sector 5 Church from FFVII Remake.jpg",
  }),
  art("places/forgotten-capital-rebirth", "1600x900", "scene", {
    alt: "The Forgotten Capital: shell-like towers and coral spires rising over still blue water.",
    title: "The Forgotten Capital, Final Fantasy VII Rebirth (in-game still)",
    wiki: "The Forgotten Capital from FFVII Rebirth.png",
  }),
  art("places/junon-rebirth", "1600x900", "scene", {
    alt: "Junon on its cliff over the sea, the great cannon, the Sister Ray, jutting into a blue sky.",
    focus: "45% 50%",
    title: "Junon and the Sister Ray, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Junon and the Sister Ray in FFVII Rebirth.png",
  }),
  art("places/temple-of-the-ancients", "1600x899", "scene", {
    alt: "The Temple of the Ancients: a stepped stone pyramid rising from mist-covered jungle.",
    focus: "60% 50%",
    title: "The Temple of the Ancients, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Temple of the Ancients from FFVII Rebirth.png",
  }),
  art("groups/avalanche-faction", "1600x900", "scene", {
    alt: "AVALANCHE fighters in combat gear firing on Shinra under floodlights.",
    focus: "40% 50%",
    title: "AVALANCHE in action, Final Fantasy VII Remake (in-game still)",
    wiki: "Avalanche Faction from FFVII Remake.png",
  }),
  art("groups/shinra-meeting", "1600x900", "scene", {
    alt: "Shinra's executives around the long boardroom table, President Shinra at its head.",
    title: "The Shinra board meeting, Final Fantasy VII Remake (in-game still)",
    wiki: "Shinra executive meeting room from FFVII Remake.jpg",
  }),
  art("groups/wutai-troops", "1600x899", "scene", {
    alt: "A Wutai soldier in samurai-style armour on a fortress wall at night, a fierce guardian statue behind him.",
    focus: "45% 35%",
    title: "Wutai's soldiers, Crisis Core -Final Fantasy VII- Reunion (in-game still)",
    wiki: "Wutai troops.png",
  }),
  art("moments/meteor-midgar", "1600x898", "scene", {
    alt: "Meteor striking Midgar: a blinding wall of fire engulfing the Shinra Building's tower.",
    title: "Meteor descends on Midgar, Final Fantasy VII Remake (in-game still)",
    wiki: "Meteor descending upon the Shinra Building from FFVII Remake.png",
  }),
  art("moments/reactor-5-trap", "1600x900", "scene", {
    alt: "Cloud in close-up, hanging on in Mako Reactor 5 as it is about to blow, Tifa and Barret behind him.",
    focus: "60% 40%",
    title: "Cloud hangs on in Mako Reactor 5, Final Fantasy VII Remake (in-game still)",
    wiki: "Cloud hanging in Mako Reactor 5 from FFVII Remake.png",
  }),
  art("moments/scorpion-sentinel", "1040x560", "scene", {
    alt: "The fight with the Scorpion Sentinel in Mako Reactor 1: the great machine firing among twisted girders.",
    title: "Scorpion Sentinel battle concept art, Final Fantasy VII Remake",
    wiki: "Scorpion Sentinel battle artwork for FFVII Remake.png",
  }),
  art("moments/aerith-altar", "1600x900", "scene", {
    alt: "Cloud holding Aerith close at the altar in the Forgotten Capital, green motes of the Lifestream drifting around them.",
    focus: "40% 40%",
    title: "Cloud and Aerith at the altar, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Cloud and Aerith in the ending from FFVII Rebirth.png",
  }),
  art("moments/sephiroth-reborn", "1600x899", "scene", {
    alt: "Cloud, sword raised, facing Sephiroth Reborn, a towering winged form, among floating rocks at the edge of creation.",
    focus: "55% 45%",
    title: "Cloud faces Sephiroth Reborn, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Sephiroth Reborn in edge of creation from FFVII Rebirth.png",
  }),
  art("moments/nanaki-seto", "1600x896", "scene", {
    alt: "Seto, turned to stone, silhouetted against a full moon, with Nanaki on the rocks below.",
    focus: "50% 72%",
    title: "Nanaki finds Seto, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Nanaki finds Seto from FFVII Rebirth.png",
  }),
  art("moments/lifestream", "500x350", "scene", {
    alt: "Cloud and Tifa falling into the glowing green Lifestream amid the wreckage of Mideel.",
    title:
      "Cloud and Tifa fall into the Lifestream, Final Fantasy VII (frame from the game's movie)",
    wiki: "Lifestream-ffvii-fmv-falling.png",
  }),
];

const BY_ID = new Map(ARTWORK.map((entry) => [entry.id, entry]));

export function artwork(id: string): ArtEntry | undefined {
  return BY_ID.get(id);
}

/** Where the image is served from. */
export function artSrc(entry: ArtEntry): string {
  return `/art/${entry.id}.webp`;
}

/** Its page on the Final Fantasy Wiki, for the credit. */
export function artSourceUrl(entry: ArtEntry): string | undefined {
  if (entry.wiki === undefined) return undefined;
  return `https://finalfantasy.fandom.com/wiki/File:${encodeURIComponent(entry.wiki.replaceAll(" ", "_"))}`;
}

/** An entity's images: its main one (the modern look first) and, for characters, the original's. */
export function artFor(entityId: string): { main?: ArtEntry; original?: ArtEntry } {
  const all = ARTWORK.filter((entry) => entry.subjects.includes(entityId));
  const original = all.find((entry) => entry.era === "og");
  const main = all.find((entry) => entry.era === "modern") ?? all.find((e) => e !== original);
  return { main, original };
}

/** The backdrop of each section, and of each title's pages. */
export const SECTION_ART = {
  home: "key/remake",
  timeline: "places/midgar-concept",
  explore: "key/intermission",
  compare: "key/cloud-nomura",
  network: "key/rebirth-party",
  divergence: "key/aerith",
  archive: "key/og-poster",
  research: "places/reactor-core",
  credits: "key/tifa",
  settings: "key/barret-marlene",
  notFound: "places/northern-crater",
} as const satisfies Record<string, string>;

export const TITLE_ART: Record<TitleCode, string> = {
  og: "key/og-poster",
  remake: "key/remake",
  intermission: "key/intermission",
  rebirth: "key/rebirth",
};

/** Each moment's one picture: where it happens, or what. No two moments share one (manifest.test.ts). */
export const MOMENT_ART: Readonly<Record<string, string>> = {
  event_jenova_calamity: "moments/calamity-meteorite",
  event_ifalna_death: "moments/ifalna-death",
  event_water_tower_promise: "key/tifa",
  event_sephiroth_learns_of_jenova_project: "places/shinra-mansion",
  event_nibelheim_incident: "key/anniversary",
  event_mako_reactor_1_bombing: "moments/scorpion-sentinel",
  event_cloud_meets_aerith: "places/sector-8",
  event_sector_7_6_annex_raid: "places/upper-sector-7",
  event_mako_reactor_5_bombing: "moments/reactor-5-trap",
  event_aerith_hires_cloud: "moments/second-chance-meeting",
  event_corneo_audition: "places/corneo-mansion",
  event_yuffie_raid_on_shinra: "moments/yuffie-sonon",
  event_sector_7_plate_fall: "places/sector-7",
  event_shinra_building_raid: "places/hojo-lab",
  event_president_shinra_death: "places/president-office",
  event_escape_from_midgar: "places/expressway",
  event_battle_at_destinys_crossroads: "key/remake",
  event_junon_parade: "places/junon",
  event_jenova_on_the_cargo_ship: "moments/jenova-lifeclinger",
  event_truth_about_seto: "moments/nanaki-seto",
  event_race_for_the_black_materia: "moments/sephiroth-black-materia",
  event_aerith_death: "moments/aerith-altar",
  event_meteor_summoned: "moments/meteor-midgar",
  event_cloud_memories_restored: "moments/lifestream",
  event_defeat_of_sephiroth: "moments/sephiroth-reborn",
};

/** A scene for an entity's page backdrop: key art, a painted place or line art — not a figure. */
/** The places and groups whose picture is chosen rather than found by subject. */
export const PLACE_ART: Readonly<Record<string, string>> = {
  location_midgar: "places/midgar-remake",
  location_nibelheim: "places/nibelheim-rebirth",
  location_cosmo_canyon: "places/cosmo-canyon-torch",
  location_northern_crater: "places/northern-crater-ending",
  location_sector_5_church: "places/church-remake",
  location_forgotten_capital: "places/forgotten-capital-rebirth",
  location_junon: "places/junon-rebirth",
  location_temple_of_the_ancients: "places/temple-of-the-ancients",
  organization_avalanche: "groups/avalanche-faction",
  organization_shinra: "groups/shinra-meeting",
  organization_wutai: "groups/wutai-troops",
};

const chosenArt = (entityId: string) =>
  BY_ID.get(MOMENT_ART[entityId] ?? PLACE_ART[entityId] ?? "");

export function sceneFor(entityId: string): ArtEntry | undefined {
  const moment = chosenArt(entityId);
  if (moment) return moment.kind === "cutout" ? undefined : moment;
  return ARTWORK.find((entry) => entry.subjects.includes(entityId) && entry.kind !== "cutout");
}

/** An entity's picture for a card or panel: a person's portrait, else a painting of it. */
export function pictureFor(entityId: string, kind: string): ArtEntry | undefined {
  const moment = chosenArt(entityId);
  if (moment) return moment;
  const art = artFor(entityId);
  return kind === "character" ? (art.main ?? art.original) : (sceneFor(entityId) ?? art.main);
}
