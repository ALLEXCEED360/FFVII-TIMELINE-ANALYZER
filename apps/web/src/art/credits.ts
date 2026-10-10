import type { ArtEntry } from "./manifest";

// Who made each image and where it came from, for the Credits page and the credit lines under
// pictures. Kept apart from manifest.ts, which every page needs at once, so the first load stays
// within its budget (docs/decisions/0013-hardening.md); this loads with the pages that credit art.

export interface Credit {
  /** What it is. */
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

/** By image ID (its path under public/art); `artist` defaults to Square Enix. */
const CREDITS: Readonly<Record<string, Omit<Credit, "artist"> & { artist?: string }>> = {
  "key/og-poster": {
    title: "Final Fantasy VII poster (1997)",
    artist: NOMURA,
    wiki: "FFVII Poster.png",
  },
  "key/og-meteor": {
    title: "Meteor logo artwork, shown as light on dark",
    artist: "Yoshitaka Amano",
    wiki: "Meteor Logo Art.jpg",
  },
  "key/remake": {
    title: "Final Fantasy VII Remake key art (Midgar Highway)",
    wiki: "Final Fantasy VII Remake key art Midgar Highway.png",
  },
  "key/intermission": {
    title: "Final Fantasy VII Remake Intergrade key visual",
    wiki: "FFVII Remake Intergrade key visual.jpg",
  },
  "key/rebirth": {
    title: "Final Fantasy VII Rebirth key art",
    wiki: "Key Art from VIIR2 - No logo.jpg",
  },
  "key/rebirth-party": {
    title: "Final Fantasy VII Rebirth key art (September 2023)",
    wiki: "Key Art from VIIR2 - September 2023 ver.jpg",
  },
  "key/aerith": {
    title: "Aerith key art from Final Fantasy VII Remake",
    wiki: "Aerith Key Art from FFVII Remake.jpg",
  },
  "key/tifa": {
    title: "Tifa key art from Final Fantasy VII Remake",
    wiki: "Tifa Lockhart from FFVII Remake key art.jpg",
  },
  "key/barret-marlene": {
    title: "Barret and Marlene key art from Final Fantasy VII Remake",
    wiki: "Barret and Marlene key art from FFVII Remake.jpg",
  },
  "key/cloud-nomura": {
    title: "Cloud Strife illustration for Final Fantasy VII Remake",
    artist: NOMURA,
    wiki: "Cloud Strife from FFVII Remake by Tetsuya Nomura.png",
  },
  "key/anniversary": {
    title: "Final Fantasy VII 10th anniversary artwork",
    artist: NOMURA,
    wiki: "FFVII 10th Anniversary Artwork.jpg",
  },
  "key/turks": {
    title: "The Turks group artwork",
    wiki: "Turks group artwork from Final Fantasy VII.png",
  },
  "key/world-map": {
    title: "World map concept art",
    wiki: "FFVII World Map Concept Art.jpg",
  },
  "characters/cloud": {
    title: "Cloud Strife, Final Fantasy VII Rebirth render",
    wiki: "Cloud Strife from FFVII Rebirth promo render.png",
  },
  "characters/cloud-og": {
    title: "Cloud Strife, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Cloud-FFVIIArt.png",
  },
  "characters/tifa": {
    title: "Tifa Lockhart, Final Fantasy VII Remake render",
    wiki: "Tifa Lockhart from FFVII Remake battle render.png",
  },
  "characters/tifa-og": {
    title: "Tifa Lockhart, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Tifa-FFVIIArt.png",
  },
  "characters/aerith": {
    title: "Aerith Gainsborough, Final Fantasy VII Remake render",
    wiki: "Aerith Gainsborough from FFVII Remake battle render.png",
  },
  "characters/aerith-og": {
    title: "Aeris Gainsborough, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Aeris-FFVIIArt.png",
  },
  "characters/barret": {
    title: "Barret Wallace, Final Fantasy VII Remake render",
    wiki: "Barret Wallace from FFVII Remake sunglasses render.png",
  },
  "characters/barret-og": {
    title: "Barret Wallace, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Barret-FFVIIArt.png",
  },
  "characters/red-xiii": {
    title: "Red XIII, Final Fantasy VII Rebirth render",
    wiki: "Red XIII from FFVII Rebirth promo render.png",
  },
  "characters/red-xiii-og": {
    title: "Red XIII, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "RedXIII-FFVIIArt.png",
  },
  "characters/yuffie": {
    title: "Yuffie Kisaragi, Final Fantasy VII Remake INTERmission artwork",
    wiki: "Yuffie-kisaragi ff7ri--artwork.png",
  },
  "characters/yuffie-og": {
    title: "Yuffie Kisaragi, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Yuffie-FFVIIArt.png",
  },
  "characters/cait-sith": {
    title: "Cait Sith and his moogle, Final Fantasy VII Revelation render",
    wiki: "Cait Sith moogle from FFVII Revelation promo render.png",
  },
  "characters/cait-sith-og": {
    title: "Cait Sith, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "CaitSith-FFVIIArt.png",
  },
  "characters/sephiroth": {
    title: "Sephiroth, Final Fantasy VII Rebirth render",
    wiki: "Sephiroth from FFVII Rebirth promo render.png",
  },
  "characters/sephiroth-og": {
    title: "Sephiroth, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Sephiroth-FFVIIArt.png",
  },
  "characters/zack": {
    title: "Zack Fair, Final Fantasy VII Revelation render",
    wiki: "Zack Fair from FFVII Revelation promo render.png",
  },
  "characters/zack-og": {
    title: "Zack concept sketch, Final Fantasy VII",
    artist: NOMURA,
    wiki: "Zack FFVII Concept Art.jpg",
  },
  "characters/president-shinra": {
    title: "President Shinra, Final Fantasy VII Remake render",
    wiki: "President Shinra render from FFVII Remake.png",
  },
  "characters/president-shinra-og": {
    title: "President Shinra, Final Fantasy VII artwork",
    wiki: "FFVII-PresidentShinra-Artwork.jpg",
  },
  "characters/rufus": {
    title: "Rufus Shinra, Final Fantasy VII Remake render",
    wiki: "Rufus Shinra from Final Fantasy VII Remake render.png",
  },
  "characters/rufus-og": {
    title: "Rufus Shinra, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Rufus artwork FFVII.png",
  },
  "characters/reno": {
    title: "Reno, Final Fantasy VII Remake render",
    wiki: "FF7 Remake Reno Full Body Render.png",
  },
  "characters/reno-og": {
    title: "Reno, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Reno artwork FF7.png",
  },
  "characters/tseng": {
    title: "Tseng, Final Fantasy VII Remake render",
    wiki: "Tseng Final Fantasy VII Remake render.png",
  },
  "characters/tseng-og": {
    title: "Tseng, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Tseng-artwork.png",
  },
  "characters/hojo": {
    title: "Professor Hojo, Final Fantasy VII Remake render",
    wiki: "Professor Hojo from FFVII Remake.png",
  },
  "characters/hojo-og": {
    title: "Hojo concept sketch, Final Fantasy VII",
    wiki: "Hojo FFVII Concept Art.jpg",
  },
  "characters/jenova": {
    title: "Jenova, Final Fantasy VII Remake artwork",
    wiki: "Jenova artwork for FFVII Remake.png",
  },
  "characters/ifalna": {
    title: "Ifalna, Final Fantasy VII Remake artwork",
    wiki: "Ifalna from Final Fantasy VII Remake artwork.png",
  },
  "characters/elmyra": {
    title: "Elmyra Gainsborough, Final Fantasy VII Remake artwork",
    wiki: "Elmyra from Final Fantasy VII Remake artwork.png",
  },
  "characters/elmyra-og": {
    title: "Elmyra Gainsborough, Final Fantasy VII artwork",
    wiki: "Elymra Gainsborough original artwork.png",
  },
  "characters/jessie": {
    title: "Jessie Rasberry, Final Fantasy VII Remake render",
    wiki: "Jessie from Final Fantasy VII Remake render.png",
  },
  "characters/jessie-og": {
    title: "Jessie, Final Fantasy VII artwork",
    wiki: "Ff7 jesse artwork.png",
  },
  "characters/don-corneo": {
    title: "Don Corneo, Final Fantasy VII Remake render",
    wiki: "Don Corneo Final Fantasy VII Remake render.png",
  },
  "characters/bugenhagen": {
    title: "Bugenhagen, Final Fantasy VII Rebirth render",
    wiki: "Bugenhagen from FFVII Rebirth render.png",
  },
  "characters/bugenhagen-og": {
    title: "Bugenhagen, Final Fantasy VII artwork",
    wiki: "FFVII - Bugenhagen Artwork.jpg",
  },
  "characters/vincent": {
    title: "Vincent Valentine, Final Fantasy VII Rebirth render",
    wiki: "Vincent Valentine from FFVII Rebirth promo render.png",
  },
  "characters/vincent-og": {
    title: "Vincent Valentine, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Vincent-FFVIIArt.png",
  },
  "characters/cid": {
    title: "Cid Highwind, Final Fantasy VII Rebirth render",
    wiki: "Cid Highwind from FFVII Rebirth promo render.png",
  },
  "characters/cid-og": {
    title: "Cid Highwind, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "CidHighwind-FFVIIArt.png",
  },
  "characters/rude": {
    title: "Rude, Final Fantasy VII Remake render",
    wiki: "FF7 Remake Rude Full Body Render.png",
  },
  "characters/rude-og": {
    title: "Rude, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Rude Artwork.png",
  },
  "characters/elena": {
    title: "Elena, Final Fantasy VII Rebirth render",
    wiki: "Elena from FFVII Rebirth promo render.png",
  },
  "characters/reeve": {
    title: "Reeve Tuesti, Final Fantasy VII Remake render",
    wiki: "Reeve Tuesti from Final Fantasy VII Remake render.png",
  },
  "characters/scarlet": {
    title: "Scarlet, Final Fantasy VII Remake render",
    wiki: "Scarlet from Final Fantasy VII Remake render.png",
  },
  "characters/biggs": {
    title: "Biggs, Final Fantasy VII Remake render",
    wiki: "Biggs FFVII Remake.png",
  },
  "characters/biggs-og": {
    title: "Biggs, Final Fantasy VII concept art",
    wiki: "Biggs from FFVII concept art.png",
  },
  "characters/wedge": {
    title: "Wedge, Final Fantasy VII Remake render",
    wiki: "Wedge FFVII Remake.png",
  },
  "characters/wedge-og": {
    title: "Wedge, Final Fantasy VII concept art",
    wiki: "Wedge from FFVII concept art.png",
  },
  "characters/marlene": {
    title: "Marlene Wallace, Final Fantasy VII Remake render",
    wiki: "Marlene Wallace from FFVII Remake render.png",
  },
  "characters/dyne": {
    title: "Dyne, Final Fantasy VII Rebirth render",
    wiki: "Dyne from FFVII Rebirth promo render.png",
  },
  "places/midgar-concept": {
    title: "Midgar concept art, Final Fantasy VII",
    wiki: "Midgar FFVII Concept Art.jpg",
  },
  "places/sector-7": {
    title: "Sector 7 pillar concept art, Final Fantasy VII Remake",
    wiki: "Sector 7 Pillar artwork for Final Fantasy VII Remake.png",
  },
  "places/wall-market": {
    title: "Wall Market concept art, Final Fantasy VII Remake",
    wiki: "Wall Market artwork 2 for Final Fantasy VII Remake.png",
  },
  "places/shinra-lobby": {
    title: "Shinra HQ lobby concept art, Final Fantasy VII Remake",
    wiki: "Shinra HQ lobby concept art FFVII Remake.png",
  },
  "places/hojo-lab": {
    title: "Hojo's laboratory concept art, Final Fantasy VII Remake",
    wiki: "Hojo's Laboratory artwork for Final Fantasy VII Remake.png",
  },
  "places/reactor-core": {
    title: "Mako reactor core concept art, Final Fantasy VII Remake",
    wiki: "Mako Reactor Core artwork for FFVII Remake.png",
  },
  "places/corneo-mansion": {
    title: "Corneo's mansion concept art, Final Fantasy VII Remake",
    wiki: "Corneo's Mansion artwork for Final Fantasy VII Remake.png",
  },
  "places/expressway": {
    title: "Midgar expressway concept art, Final Fantasy VII Remake",
    wiki: "Midgar Expressway artwork 3 for Final Fantasy VII Remake.png",
  },
  "places/junon": {
    title: "Junon CG artwork, Final Fantasy VII",
    wiki: "Junon FFVII CG Art 1.jpg",
  },
  "places/northern-crater": {
    title: "Northern Crater Lifestream sketch, Final Fantasy VII",
    wiki: "Northern Crater Lifestream Eruption FFVII Sketch.jpg",
  },
  "places/shinra-mansion": {
    title: "Shinra Mansion concept art, Dirge of Cerberus -Final Fantasy VII-",
    wiki: "DoC Shinra Mansion 1 Artwork.png",
  },
  "places/sector-8": {
    title: "Sector 8 concept art, Final Fantasy VII Remake",
    wiki: "Sector 8 artwork for FFVII Remake.png",
  },
  "places/upper-sector-7": {
    title: "Upper Sector 7 concept art, Final Fantasy VII Remake",
    wiki: "Upper Sector 7 artwork for Final Fantasy VII Remake.png",
  },
  "places/president-office": {
    title: "President's office concept art, Final Fantasy VII Remake",
    wiki: "President-Office-Shinra-HQ-FFVIIR-Art.jpg",
  },
  "moments/second-chance-meeting": {
    title: "Aerith and Cloud in the church, Final Fantasy VII Remake (in-game still)",
    wiki: "Second Chance Meeting from FFVII Remake.png",
  },
  "moments/yuffie-sonon": {
    title: "Yuffie and Sonon, Final Fantasy VII Remake Intergrade (Square Enix promo screenshot)",
    wiki: "FFVII Remake Intergrade promo 3.png",
  },
  "moments/jenova-lifeclinger": {
    title: "JENOVA Lifeclinger, Final Fantasy VII Rebirth (render of the game's model)",
    artist: "Yare Yare Dong (render of the game's model)",
    wiki: "JENOVA Lifeclinger from FFVII Rebirth render.png",
  },
  "moments/ifalna-death": {
    title: "Ifalna's death, Final Fantasy VII Remake (in-game still)",
    wiki: "Ifalna's death from Final Fantasy VII Remake.png",
  },
  "moments/calamity-meteorite": {
    title: "The meteorite that brought Jenova, Final Fantasy VII Remake (in-game still)",
    wiki: "Meteorite that destroyed the Cetra from FFVII Remake.png",
  },
  "moments/sephiroth-black-materia": {
    title: "Sephiroth holds the black materia, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Sephiroth and the black materia from FFVII Rebirth.png",
  },
  "places/midgar-remake": {
    title: "Midgar, Final Fantasy VII Remake (trailer still)",
    wiki: "Midgar-FFVII-Remake.png",
  },
  "places/nibelheim-rebirth": {
    title: "Nibelheim, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Nibelheim in chapter 1 from FFVII Rebirth.png",
  },
  "places/cosmo-canyon-torch": {
    title: "The torch of Cosmo Canyon, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Aerith at Cosmo Canyon's Torch from FFVII Rebirth.png",
  },
  "places/northern-crater-ending": {
    title: "The Northern Crater, Final Fantasy VII (frame from the game's movie)",
    wiki: "NorthCrater-ffvii-ending.png",
  },
  "places/church-remake": {
    title: "The Sector 5 church, Final Fantasy VII Remake (screenshot)",
    wiki: "Sector 5 Church from FFVII Remake.jpg",
  },
  "places/forgotten-capital-rebirth": {
    title: "The Forgotten Capital, Final Fantasy VII Rebirth (in-game still)",
    wiki: "The Forgotten Capital from FFVII Rebirth.png",
  },
  "places/junon-rebirth": {
    title: "Junon and the Sister Ray, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Junon and the Sister Ray in FFVII Rebirth.png",
  },
  "places/temple-of-the-ancients": {
    title: "The Temple of the Ancients, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Temple of the Ancients from FFVII Rebirth.png",
  },
  "groups/avalanche-faction": {
    title: "AVALANCHE in action, Final Fantasy VII Remake (in-game still)",
    wiki: "Avalanche Faction from FFVII Remake.png",
  },
  "groups/shinra-meeting": {
    title: "The Shinra board meeting, Final Fantasy VII Remake (in-game still)",
    wiki: "Shinra executive meeting room from FFVII Remake.jpg",
  },
  "groups/wutai-troops": {
    title: "Wutai's soldiers, Crisis Core -Final Fantasy VII- Reunion (in-game still)",
    wiki: "Wutai troops.png",
  },
  "moments/meteor-midgar": {
    title: "Meteor descends on Midgar, Final Fantasy VII Remake (in-game still)",
    wiki: "Meteor descending upon the Shinra Building from FFVII Remake.png",
  },
  "moments/reactor-5-trap": {
    title: "Cloud hangs on in Mako Reactor 5, Final Fantasy VII Remake (in-game still)",
    wiki: "Cloud hanging in Mako Reactor 5 from FFVII Remake.png",
  },
  "moments/scorpion-sentinel": {
    title: "Scorpion Sentinel battle concept art, Final Fantasy VII Remake",
    wiki: "Scorpion Sentinel battle artwork for FFVII Remake.png",
  },
  "moments/aerith-altar": {
    title: "Cloud and Aerith at the altar, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Cloud and Aerith in the ending from FFVII Rebirth.png",
  },
  "moments/sephiroth-reborn": {
    title: "Cloud faces Sephiroth Reborn, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Sephiroth Reborn in edge of creation from FFVII Rebirth.png",
  },
  "moments/nanaki-seto": {
    title: "Nanaki finds Seto, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Nanaki finds Seto from FFVII Rebirth.png",
  },
  "moments/lifestream": {
    title:
      "Cloud and Tifa fall into the Lifestream, Final Fantasy VII (frame from the game's movie)",
    wiki: "Lifestream-ffvii-fmv-falling.png",
  },
};

/** An image's credit. */
export function creditFor(entry: ArtEntry): Credit {
  const credit = CREDITS[entry.id];
  if (!credit) throw new Error(`no credit for ${entry.id}`);
  return { artist: SE, ...credit };
}

/** Its page on the Final Fantasy Wiki, for the credit. */
export function artSourceUrl(credit: Credit): string | undefined {
  if (credit.wiki === undefined) return undefined;
  return `https://finalfantasy.fandom.com/wiki/File:${encodeURIComponent(credit.wiki.replaceAll(" ", "_"))}`;
}

/** The IDs that have a credit, so a test can match them to the manifest. */
export const CREDITED: readonly string[] = Object.keys(CREDITS);
