import type { TitleCode } from "../api/client";

// Every image the site shows: official Square Enix art from the Final Fantasy Wiki, converted by
// scripts/fetch_art.py. Decoration only; never AI-made. What each shows, who made it and where it
// came from are in details.ts (shown on /credits).

export interface ArtEntry {
  /** Its path under public/art, without extension: "characters/cloud". */
  id: string;
  width: number;
  height: number;
  /** key: a full illustration. cutout: a figure on transparency. scene: a place. lineart: a sketch. */
  kind: "key" | "cutout" | "scene" | "lineart";
  /** Where to centre it when the layout crops it (CSS object-position). */
  focus?: string;
  /** Where a lopsided figure's body sits across the picture (0–1), so it can stand centred. */
  centre?: number;
  /** Entities it depicts or evokes, so their pages can use it. */
  subjects: readonly string[];
  /** For a character's pair of images: the original's artwork, or the Remake/Rebirth look. */
  era?: "og" | "modern";
}

function art(
  id: string,
  size: string,
  kind: ArtEntry["kind"],
  entry: Omit<ArtEntry, "id" | "width" | "height" | "kind" | "subjects"> &
    Partial<Pick<ArtEntry, "subjects">>,
): ArtEntry {
  const [width = 0, height = 0] = size.split("x").map(Number);
  return { id, width, height, kind, subjects: [], ...entry };
}

export const ARTWORK: readonly ArtEntry[] = [
  // ── Key art ─────────────────────────────────────────────────────────────────────────────────
  art("key/og-poster", "650x916", "key", {
    focus: "50% 30%",
  }),
  art("key/og-meteor", "1446x940", "lineart", {}),
  art("key/remake", "2200x947", "key", {
    focus: "60% 50%",
  }),
  art("key/intermission", "1920x1080", "key", {
    focus: "55% 50%",
  }),
  art("key/rebirth", "1200x1500", "key", {
    focus: "50% 45%",
  }),
  art("key/rebirth-party", "1200x1600", "key", {
    focus: "50% 45%",
  }),
  art("key/aerith", "2200x1724", "key", {
    focus: "35% 50%",
    subjects: ["character_aerith_gainsborough"],
  }),
  art("key/tifa", "1000x752", "key", {
    focus: "50% 55%",
    subjects: ["character_tifa_lockhart"],
  }),
  art("key/barret-marlene", "2200x1652", "key", {
    focus: "40% 50%",
    subjects: ["character_barret_wallace", "organization_avalanche"],
  }),
  art("key/cloud-nomura", "1000x935", "key", {
    focus: "50% 30%",
    subjects: ["character_cloud_strife"],
  }),
  art("key/anniversary", "462x554", "key", {
    subjects: ["organization_soldier"],
  }),
  art("key/turks", "925x725", "cutout", {
    subjects: ["organization_turks"],
  }),
  art("key/world-map", "628x498", "key", {}),

  // ── Characters: the Remake/Rebirth look, and the original's artwork ────────────────────────
  art("characters/cloud", "451x1080", "cutout", {
    subjects: ["character_cloud_strife"],
    era: "modern",
  }),
  art("characters/cloud-og", "1024x1238", "cutout", {
    subjects: ["character_cloud_strife"],
    era: "og",
  }),
  art("characters/tifa", "788x1400", "cutout", {
    subjects: ["character_tifa_lockhart"],
    era: "modern",
  }),
  art("characters/tifa-og", "597x1251", "cutout", {
    subjects: ["character_tifa_lockhart"],
    era: "og",
  }),
  art("characters/aerith", "890x1400", "cutout", {
    subjects: ["character_aerith_gainsborough"],
    era: "modern",
  }),
  art("characters/aerith-og", "558x1304", "cutout", {
    subjects: ["character_aerith_gainsborough"],
    era: "og",
  }),
  art("characters/barret", "671x1239", "cutout", {
    subjects: ["character_barret_wallace"],
    era: "modern",
  }),
  art("characters/barret-og", "1011x1140", "cutout", {
    subjects: ["character_barret_wallace"],
    era: "og",
  }),
  art("characters/red-xiii", "937x585", "cutout", {
    subjects: ["character_red_xiii"],
    era: "modern",
  }),
  art("characters/red-xiii-og", "404x222", "cutout", {
    subjects: ["character_red_xiii"],
    era: "og",
  }),
  art("characters/yuffie", "1032x1400", "cutout", {
    subjects: ["character_yuffie"],
    era: "modern",
  }),
  art("characters/yuffie-og", "637x1351", "cutout", {
    subjects: ["character_yuffie"],
    era: "og",
  }),
  art("characters/cait-sith", "1112x1400", "cutout", {
    subjects: ["character_cait_sith"],
    era: "modern",
  }),
  art("characters/cait-sith-og", "992x1173", "cutout", {
    subjects: ["character_cait_sith"],
    era: "og",
  }),
  art("characters/sephiroth", "404x853", "cutout", {
    subjects: ["character_sephiroth"],
    era: "modern",
  }),
  art("characters/sephiroth-og", "433x600", "cutout", {
    subjects: ["character_sephiroth"],
    era: "og",
  }),
  art("characters/zack", "519x1400", "cutout", {
    subjects: ["character_zack_fair"],
    era: "modern",
  }),
  art("characters/zack-og", "213x561", "lineart", {
    subjects: ["character_zack_fair"],
    era: "og",
  }),
  art("characters/president-shinra", "386x1172", "cutout", {
    subjects: ["character_president_shinra"],
    era: "modern",
  }),
  art("characters/president-shinra-og", "390x800", "lineart", {
    subjects: ["character_president_shinra"],
    era: "og",
  }),
  art("characters/rufus", "362x1132", "cutout", {
    subjects: ["character_rufus_shinra"],
    era: "modern",
  }),
  art("characters/rufus-og", "574x1245", "cutout", {
    subjects: ["character_rufus_shinra"],
    era: "og",
  }),
  art("characters/reno", "371x1286", "cutout", {
    subjects: ["character_reno"],
    era: "modern",
  }),
  art("characters/reno-og", "366x1255", "cutout", {
    subjects: ["character_reno"],
    era: "og",
  }),
  art("characters/tseng", "249x820", "cutout", {
    subjects: ["character_tseng"],
    era: "modern",
  }),
  art("characters/tseng-og", "250x657", "cutout", {
    subjects: ["character_tseng"],
    era: "og",
  }),
  art("characters/hojo", "462x1204", "cutout", {
    subjects: ["character_hojo"],
    era: "modern",
  }),
  art("characters/hojo-og", "214x532", "lineart", {
    subjects: ["character_hojo"],
    era: "og",
  }),
  art("characters/jenova", "360x1001", "cutout", {
    subjects: ["character_jenova"],
    era: "modern",
  }),
  art("characters/ifalna", "355x1007", "cutout", {
    subjects: ["character_ifalna"],
    era: "modern",
  }),
  art("characters/elmyra", "455x1023", "cutout", {
    subjects: ["character_elmyra_gainsborough"],
    era: "modern",
  }),
  art("characters/elmyra-og", "402x549", "cutout", {
    subjects: ["character_elmyra_gainsborough"],
    era: "og",
  }),
  art("characters/jessie", "406x1199", "cutout", {
    subjects: ["character_jessie"],
    era: "modern",
  }),
  art("characters/jessie-og", "439x953", "cutout", {
    subjects: ["character_jessie"],
    era: "og",
  }),
  art("characters/don-corneo", "624x1068", "cutout", {
    subjects: ["character_don_corneo", "event_corneo_audition"],
    era: "modern",
  }),
  art("characters/bugenhagen", "295x762", "cutout", {
    subjects: ["character_bugenhagen"],
    era: "modern",
  }),
  art("characters/bugenhagen-og", "262x556", "lineart", {
    subjects: ["character_bugenhagen"],
    era: "og",
  }),
  art("characters/vincent", "339x884", "cutout", {
    subjects: ["character_vincent_valentine"],
    era: "modern",
  }),
  art("characters/vincent-og", "706x1229", "cutout", {
    subjects: ["character_vincent_valentine"],
    era: "og",
  }),
  art("characters/cid", "306x879", "cutout", {
    subjects: ["character_cid_highwind"],
    era: "modern",
  }),
  art("characters/cid-og", "554x1253", "cutout", {
    subjects: ["character_cid_highwind"],
    era: "og",
  }),
  art("characters/rude", "324x1225", "cutout", {
    subjects: ["character_rude"],
    era: "modern",
  }),
  art("characters/rude-og", "253x641", "cutout", {
    subjects: ["character_rude"],
    era: "og",
  }),
  art("characters/elena", "222x764", "cutout", {
    subjects: ["character_elena"],
    era: "modern",
  }),
  art("characters/reeve", "340x1078", "cutout", {
    subjects: ["character_reeve_tuesti"],
    era: "modern",
  }),
  art("characters/scarlet", "460x1158", "cutout", {
    subjects: ["character_scarlet"],
    era: "modern",
  }),
  art("characters/biggs", "363x1209", "cutout", {
    subjects: ["character_biggs"],
    era: "modern",
  }),
  art("characters/biggs-og", "467x973", "cutout", {
    subjects: ["character_biggs"],
    era: "og",
  }),
  art("characters/wedge", "531x1185", "cutout", {
    subjects: ["character_wedge"],
    era: "modern",
  }),
  art("characters/wedge-og", "530x863", "cutout", {
    subjects: ["character_wedge"],
    era: "og",
  }),
  art("characters/marlene", "548x1400", "cutout", {
    subjects: ["character_marlene"],
    era: "modern",
  }),
  art("characters/dyne", "389x804", "cutout", {
    subjects: ["character_dyne"],
    era: "modern",
  }),
  art("characters/sonon", "716x822", "cutout", {
    subjects: ["character_sonon_kusakabe"],
    era: "modern",
    centre: 0.729,
  }),

  // ── Places ──────────────────────────────────────────────────────────────────────────────────
  art("places/midgar-concept", "1379x1062", "scene", {
    focus: "50% 45%",
    subjects: ["location_midgar"],
  }),
  art("places/sector-7", "1260x755", "scene", {
    focus: "40% 50%",
    subjects: ["location_sector_7"],
  }),
  art("places/wall-market", "1002x608", "scene", {
    subjects: ["location_wall_market"],
  }),
  art("places/shinra-lobby", "1600x968", "scene", {
    subjects: ["location_shinra_building"],
  }),
  art("places/hojo-lab", "1300x730", "scene", {}),
  art("places/corneo-mansion", "1002x543", "scene", {}),
  art("places/expressway", "884x505", "scene", {}),
  art("places/junon", "1403x1053", "scene", {
    subjects: ["location_junon"],
  }),
  art("places/northern-crater", "1144x798", "lineart", {
    subjects: ["location_northern_crater"],
  }),
  art("places/shinra-mansion", "218x143", "scene", {}),
  art("places/sector-8", "1300x700", "scene", {}),
  art("places/upper-sector-7", "689x352", "scene", {}),
  art("places/president-office", "1200x710", "scene", {}),
  // ── Moments no artwork shows: stills, Square Enix promo shots and a model render ───────────
  art("moments/second-chance-meeting", "1600x901", "scene", {
    focus: "35% 50%",
  }),
  art("moments/yuffie-sonon", "1600x900", "scene", {
    focus: "45% 40%",
  }),
  art("moments/jenova-emergent", "1600x900", "scene", {}),
  art("moments/ifalna-death", "1600x900", "scene", {
    focus: "50% 55%",
  }),
  art("moments/calamity-meteorite", "1600x900", "scene", {
    focus: "60% 35%",
  }),
  art("moments/sephiroth-black-materia", "1600x898", "scene", {
    focus: "45% 40%",
  }),
  // ── Places and groups no artwork shows ─────────────────────────────────────────────────────
  art("places/midgar-remake", "1600x678", "scene", {}),
  art("places/nibelheim-rebirth", "1600x703", "scene", {}),
  art("places/cosmo-canyon-torch", "1600x900", "scene", {
    focus: "50% 40%",
  }),
  art("places/northern-crater-ending", "500x238", "scene", {}),
  art("places/church-remake", "1600x900", "scene", {
    focus: "55% 55%",
  }),
  art("places/forgotten-capital-rebirth", "1600x900", "scene", {}),
  art("places/junon-rebirth", "1600x900", "scene", {
    focus: "45% 50%",
  }),
  art("places/temple-of-the-ancients", "1600x899", "scene", {
    focus: "60% 50%",
  }),
  art("groups/avalanche-faction", "1600x900", "scene", {
    focus: "40% 50%",
  }),
  art("groups/shinra-meeting", "1600x900", "scene", {}),
  art("groups/wutai-troops", "1600x899", "scene", {
    focus: "45% 35%",
  }),
  art("moments/meteor-midgar", "1600x898", "scene", {}),
  art("moments/reactor-5-trap", "1600x900", "scene", {
    focus: "60% 40%",
  }),
  art("moments/scorpion-sentinel", "1040x560", "scene", {}),
  art("moments/aerith-altar", "1600x900", "scene", {
    focus: "40% 40%",
  }),
  art("moments/sephiroth-reborn", "1600x899", "scene", {
    focus: "55% 45%",
  }),
  art("moments/nanaki-seto", "1600x896", "scene", {
    focus: "50% 72%",
  }),
  art("moments/lifestream", "500x350", "scene", {}),
  art("places/kalm", "1600x897", "scene", {}),
  art("places/gold-saucer", "1600x900", "scene", {}),
  art("places/gongaga", "1600x900", "scene", {}),
  art("places/gongaga-reactor", "1600x900", "scene", {}),
  art("places/costa-del-sol", "1306x730", "scene", {}),
  art("places/mythril-mine", "1600x898", "scene", {}),
  art("places/shinra-manor", "1600x900", "scene", {}),
  art("places/corel-prison", "1600x648", "scene", {
    focus: "50% 30%",
  }),
  art("places/sleeping-forest", "384x672", "scene", {}),
  art("places/train-graveyard", "1600x900", "scene", {}),
  art("places/under-junon", "1200x554", "scene", {}),
  art("places/corel", "512x512", "scene", {}),
  art("places/rocket-town", "1024x1024", "scene", {}),
  art("moments/clouds-story-at-kalm", "1600x898", "scene", {}),
  art("moments/turks-in-mythril-mine", "1600x899", "scene", {}),
  art("moments/hojo-at-costa-del-sol", "1600x900", "scene", {}),
  art("moments/keystone-stolen", "1600x899", "scene", {}),
  art("moments/aerith-dream", "1600x709", "scene", {}),
  art("moments/junon-gas-chamber", "320x240", "scene", {}),
  art("moments/shocking-reunion", "1024x476", "scene", {
    focus: "50% 40%",
  }),
  art("moments/shinra-submarine", "470x350", "key", {}),
  art("moments/shinra-no-26", "568x476", "scene", {}),
  art("moments/white-materia", "500x350", "scene", {}),
  art("moments/diamond-weapon", "500x350", "scene", {}),
  art("moments/sister-ray", "500x350", "scene", {}),
  art("moments/highwind-boosters", "500x350", "scene", {}),
  art("moments/northern-cave", "1600x774", "scene", {}),
  art("places/mideel", "640x480", "scene", {}),
  art("moments/gateway-to-heaven", "432x336", "scene", {}),
  art("places/fort-condor", "866x1261", "scene", {
    focus: "50% 35%",
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

/** Its small square version, for the network's orbs (made by scripts/make_thumbs.py). */
export function thumbSrc(entry: ArtEntry): string {
  return `/thumbs/${entry.id}.webp`;
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
  event_jenova_on_the_cargo_ship: "moments/jenova-emergent",
  event_truth_about_seto: "moments/nanaki-seto",
  event_race_for_the_black_materia: "moments/sephiroth-black-materia",
  event_aerith_death: "moments/aerith-altar",
  event_meteor_summoned: "moments/meteor-midgar",
  event_cloud_memories_restored: "moments/lifestream",
  event_defeat_of_sephiroth: "moments/sephiroth-reborn",
  event_clouds_story_at_kalm: "moments/clouds-story-at-kalm",
  event_turks_in_the_mythril_mine: "moments/turks-in-mythril-mine",
  event_hojo_at_costa_del_sol: "moments/hojo-at-costa-del-sol",
  event_framed_at_the_gold_saucer: "moments/gateway-to-heaven",
  event_keystone_stolen: "moments/keystone-stolen",
  event_aerith_dream_in_the_sleeping_forest: "moments/aerith-dream",
  event_junon_execution: "moments/junon-gas-chamber",
  event_cloud_found_in_mideel: "moments/shocking-reunion",
  event_race_for_the_huge_materia: "moments/shinra-submarine",
  event_rocket_launch: "moments/shinra-no-26",
  event_aerith_prayer_revealed: "moments/white-materia",
  event_weapon_attacks_midgar: "moments/diamond-weapon",
  event_hojos_last_stand: "moments/sister-ray",
  event_night_before_the_end: "moments/highwind-boosters",
  event_into_the_northern_cave: "moments/northern-cave",
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
  location_kalm: "places/kalm",
  location_gold_saucer: "places/gold-saucer",
  location_gongaga: "places/gongaga",
  location_gongaga_reactor: "places/gongaga-reactor",
  location_costa_del_sol: "places/costa-del-sol",
  location_mythril_mine: "places/mythril-mine",
  location_shinra_manor: "places/shinra-manor",
  location_corel_prison: "places/corel-prison",
  location_sleeping_forest: "places/sleeping-forest",
  location_sector_8: "places/sector-8",
  location_train_graveyard: "places/train-graveyard",
  location_under_junon: "places/under-junon",
  location_corel: "places/corel",
  location_rocket_town: "places/rocket-town",
  location_mideel: "places/mideel",
  location_fort_condor: "places/fort-condor",
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
