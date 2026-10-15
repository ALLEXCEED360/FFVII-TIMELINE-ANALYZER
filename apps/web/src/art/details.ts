import type { ArtEntry } from "./manifest";

// What each image shows (its alt text) and its credit. Kept out of manifest.ts, which every page
// loads at once, so the first load stays small (docs/decisions/0013-hardening.md).

export interface ArtDetails {
  /** Describes the image for screen readers. */
  alt: string;
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
const DETAILS: Readonly<Record<string, Omit<ArtDetails, "artist"> & { artist?: string }>> = {
  "key/og-poster": {
    alt: "The original Final Fantasy VII party in a crowded poster: Cloud with the Buster Sword at the centre, Aerith, Vincent, Yuffie, Barret, Tifa, Red XIII and Cait Sith around him, under a red Shinra emblem.",
    title: "Final Fantasy VII poster (1997)",
    artist: NOMURA,
    wiki: "FFVII Poster.png",
  },
  "key/og-meteor": {
    alt: "Yoshitaka Amano's Meteor: a great sphere trailing a tail of streaks, with a small moon beside it.",
    title: "Meteor logo artwork, shown as light on dark",
    artist: "Yoshitaka Amano",
    wiki: "Meteor Logo Art.jpg",
  },
  "key/remake": {
    alt: "Red XIII, Aerith, Cloud on his motorbike, Barret and Tifa on the broken end of a highway at dusk, Midgar's towers behind them.",
    title: "Final Fantasy VII Remake key art (Midgar Highway)",
    wiki: "Final Fantasy VII Remake key art Midgar Highway.png",
  },
  "key/intermission": {
    alt: "Tifa, Barret, Cloud on his motorbike, Aerith and Red XIII, seen from behind on a rooftop, looking out over the cranes beyond Midgar at sunrise.",
    title: "Final Fantasy VII Remake Intergrade key visual",
    wiki: "FFVII Remake Intergrade key visual.jpg",
  },
  "key/rebirth": {
    alt: "Cloud and Zack standing either side of a distant Sephiroth in shallow water, beneath a blazing red sky between rock spires.",
    title: "Final Fantasy VII Rebirth key art",
    wiki: "Key Art from VIIR2 - No logo.jpg",
  },
  "key/rebirth-party": {
    alt: "Tifa and Aerith standing either side of a distant Sephiroth in shallow water, beneath a blazing red sky between rock spires.",
    title: "Final Fantasy VII Rebirth key art (September 2023)",
    wiki: "Key Art from VIIR2 - September 2023 ver.jpg",
  },
  "key/aerith": {
    alt: "Aerith, seen from behind, standing on an open road under a wide blue sky with clouds.",
    title: "Aerith key art from Final Fantasy VII Remake",
    wiki: "Aerith Key Art from FFVII Remake.jpg",
  },
  "key/tifa": {
    alt: "Tifa sitting on top of Nibelheim's water tower under a starry night sky.",
    title: "Tifa key art from Final Fantasy VII Remake",
    wiki: "Tifa Lockhart from FFVII Remake key art.jpg",
  },
  "key/barret-marlene": {
    alt: "Barret, seen from behind with Marlene on his shoulders, facing the flowers in the ruined Sector 5 church.",
    title: "Barret and Marlene key art from Final Fantasy VII Remake",
    wiki: "Barret and Marlene key art from FFVII Remake.jpg",
  },
  "key/cloud-nomura": {
    alt: "Cloud in close-up, one arm raised behind his head, the Buster Sword's hilt over his shoulder.",
    title: "Cloud Strife illustration for Final Fantasy VII Remake",
    artist: NOMURA,
    wiki: "Cloud Strife from FFVII Remake by Tetsuya Nomura.png",
  },
  "key/anniversary": {
    alt: "Sephiroth, Zack and Cloud in profile, one behind the other, in Nomura's ink-and-colour style.",
    title: "Final Fantasy VII 10th anniversary artwork",
    artist: NOMURA,
    wiki: "FFVII 10th Anniversary Artwork.jpg",
  },
  "key/turks": {
    alt: "The Turks standing in a line in their dark suits \u2014 Elena, Tseng, Rude and Reno \u2014 with Rufus Shinra in white at the centre.",
    title: "The Turks group artwork",
    wiki: "Turks group artwork from Final Fantasy VII.png",
  },
  "key/world-map": {
    alt: "An early hand-drawn map of the Planet's continents, labelled in Japanese.",
    title: "World map concept art",
    wiki: "FFVII World Map Concept Art.jpg",
  },
  "characters/cloud": {
    alt: "Cloud in his Remake look, the Buster Sword resting on his shoulder.",
    title: "Cloud Strife, Final Fantasy VII Rebirth render",
    wiki: "Cloud Strife from FFVII Rebirth promo render.png",
  },
  "characters/cloud-og": {
    alt: "Cloud in the original's artwork, holding the Buster Sword out to one side.",
    title: "Cloud Strife, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Cloud-FFVIIArt.png",
  },
  "characters/tifa": {
    alt: "Tifa in her Remake look, fists raised in her fighting stance.",
    title: "Tifa Lockhart, Final Fantasy VII Remake render",
    wiki: "Tifa Lockhart from FFVII Remake battle render.png",
  },
  "characters/tifa-og": {
    alt: "Tifa in the original's artwork, in her white top and gloves.",
    title: "Tifa Lockhart, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Tifa-FFVIIArt.png",
  },
  "characters/aerith": {
    alt: "Aerith in her Remake look, holding her staff in both hands.",
    title: "Aerith Gainsborough, Final Fantasy VII Remake render",
    wiki: "Aerith Gainsborough from FFVII Remake battle render.png",
  },
  "characters/aerith-og": {
    alt: "Aerith in the original's artwork, in her pink dress, holding her staff.",
    title: "Aeris Gainsborough, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Aeris-FFVIIArt.png",
  },
  "characters/barret": {
    alt: "Barret in his Remake look, wearing sunglasses, his gun-arm at his side.",
    title: "Barret Wallace, Final Fantasy VII Remake render",
    wiki: "Barret Wallace from FFVII Remake sunglasses render.png",
  },
  "characters/barret-og": {
    alt: "Barret in the original's artwork, planted wide with his gun-arm.",
    title: "Barret Wallace, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Barret-FFVIIArt.png",
  },
  "characters/red-xiii": {
    alt: "Red XIII in his Rebirth look, prowling low, his flame-tipped tail raised.",
    title: "Red XIII, Final Fantasy VII Rebirth render",
    wiki: "Red XIII from FFVII Rebirth promo render.png",
  },
  "characters/red-xiii-og": {
    alt: "Red XIII in the original's artwork, mid-stride.",
    title: "Red XIII, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "RedXIII-FFVIIArt.png",
  },
  "characters/yuffie": {
    alt: "Yuffie in her INTERmission look, her giant shuriken held behind her.",
    title: "Yuffie Kisaragi, Final Fantasy VII Remake INTERmission artwork",
    wiki: "Yuffie-kisaragi ff7ri--artwork.png",
  },
  "characters/yuffie-og": {
    alt: "Yuffie in the original's artwork, holding her shuriken overhead.",
    title: "Yuffie Kisaragi, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Yuffie-FFVIIArt.png",
  },
  "characters/cait-sith": {
    alt: "Cait Sith in his Remake Trilogy look, crown on his head and megaphone raised, riding his great white moogle.",
    title: "Cait Sith and his moogle, Final Fantasy VII Revelation render",
    wiki: "Cait Sith moogle from FFVII Revelation promo render.png",
  },
  "characters/cait-sith-og": {
    alt: "Cait Sith in the original's artwork, riding his great white moogle.",
    title: "Cait Sith, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "CaitSith-FFVIIArt.png",
  },
  "characters/sephiroth": {
    alt: "Sephiroth in his Rebirth look, the Masamune held low at his side.",
    title: "Sephiroth, Final Fantasy VII Rebirth render",
    wiki: "Sephiroth from FFVII Rebirth promo render.png",
  },
  "characters/sephiroth-og": {
    alt: "Sephiroth in the original's artwork, the Masamune's long blade sweeping out behind him.",
    title: "Sephiroth, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Sephiroth-FFVIIArt.png",
  },
  "characters/zack": {
    alt: "Zack in his Remake Trilogy look, standing in his SOLDIER uniform, the Buster Sword on his back.",
    title: "Zack Fair, Final Fantasy VII Revelation render",
    wiki: "Zack Fair from FFVII Revelation promo render.png",
  },
  "characters/zack-og": {
    alt: "A pencil sketch of Zack in SOLDIER uniform, sword on his back, with notes in Japanese.",
    title: "Zack concept sketch, Final Fantasy VII",
    artist: NOMURA,
    wiki: "Zack FFVII Concept Art.jpg",
  },
  "characters/president-shinra": {
    alt: "President Shinra in his Remake look, in a dark double-breasted suit.",
    title: "President Shinra, Final Fantasy VII Remake render",
    wiki: "President Shinra render from FFVII Remake.png",
  },
  "characters/president-shinra-og": {
    alt: "A line drawing of President Shinra, one finger raised as he speaks.",
    title: "President Shinra, Final Fantasy VII artwork",
    wiki: "FFVII-PresidentShinra-Artwork.jpg",
  },
  "characters/rufus": {
    alt: "Rufus Shinra in his Remake look, in his long white coat.",
    title: "Rufus Shinra, Final Fantasy VII Remake render",
    wiki: "Rufus Shinra from Final Fantasy VII Remake render.png",
  },
  "characters/rufus-og": {
    alt: "Rufus Shinra in the original's artwork, in white, a shotgun at his side.",
    title: "Rufus Shinra, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Rufus artwork FFVII.png",
  },
  "characters/reno": {
    alt: "Reno in his Remake look, in an open black suit jacket, goggles pushed up into his red hair.",
    title: "Reno, Final Fantasy VII Remake render",
    wiki: "FF7 Remake Reno Full Body Render.png",
  },
  "characters/reno-og": {
    alt: "Reno in the original's artwork, his red hair tied back, rod in hand.",
    title: "Reno, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Reno artwork FF7.png",
  },
  "characters/tseng": {
    alt: "Tseng in his Remake look, standing straight in a dark suit and tie.",
    title: "Tseng, Final Fantasy VII Remake render",
    wiki: "Tseng Final Fantasy VII Remake render.png",
  },
  "characters/tseng-og": {
    alt: "Tseng in the original's artwork, in his dark blue suit.",
    title: "Tseng, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Tseng-artwork.png",
  },
  "characters/hojo": {
    alt: "Hojo in his Remake look, in a white lab coat, one hand behind his head.",
    title: "Professor Hojo, Final Fantasy VII Remake render",
    wiki: "Professor Hojo from FFVII Remake.png",
  },
  "characters/hojo-og": {
    alt: "A pencil sketch of Hojo from the side, hair tied back, glasses on.",
    title: "Hojo concept sketch, Final Fantasy VII",
    wiki: "Hojo FFVII Concept Art.jpg",
  },
  "characters/jenova": {
    alt: "Jenova's headless specimen body, bound in tubes and machinery above a great fleshy mass.",
    title: "Jenova, Final Fantasy VII Remake artwork",
    wiki: "Jenova artwork for FFVII Remake.png",
  },
  "characters/ifalna": {
    alt: "Ifalna in her Remake look, in a long dark red dress, her hair loose.",
    title: "Ifalna, Final Fantasy VII Remake artwork",
    wiki: "Ifalna from Final Fantasy VII Remake artwork.png",
  },
  "characters/elmyra": {
    alt: "Elmyra in her Remake look, hands on hips, in a green dress and cream apron.",
    title: "Elmyra Gainsborough, Final Fantasy VII Remake artwork",
    wiki: "Elmyra from Final Fantasy VII Remake artwork.png",
  },
  "characters/elmyra-og": {
    alt: "Elmyra in the original's artwork, holding a broom, in a green dress and apron.",
    title: "Elmyra Gainsborough, Final Fantasy VII artwork",
    wiki: "Elymra Gainsborough original artwork.png",
  },
  "characters/jessie": {
    alt: "Jessie in her Remake look, in light armour and a red headband, hand on her hip.",
    title: "Jessie Rasberry, Final Fantasy VII Remake render",
    wiki: "Jessie from Final Fantasy VII Remake render.png",
  },
  "characters/jessie-og": {
    alt: "Jessie in the original's artwork, waving, in armour and a red headband.",
    title: "Jessie, Final Fantasy VII artwork",
    wiki: "Ff7 jesse artwork.png",
  },
  "characters/don-corneo": {
    alt: "Don Corneo in his Remake look, in a fur-collared red coat, arms held wide.",
    title: "Don Corneo, Final Fantasy VII Remake render",
    wiki: "Don Corneo Final Fantasy VII Remake render.png",
  },
  "characters/bugenhagen": {
    alt: "Bugenhagen in his Rebirth look, floating on a glowing green orb, in long dark robes.",
    title: "Bugenhagen, Final Fantasy VII Rebirth render",
    wiki: "Bugenhagen from FFVII Rebirth render.png",
  },
  "characters/bugenhagen-og": {
    alt: "A line drawing of Bugenhagen floating on his orb, his beard tied in a knot.",
    title: "Bugenhagen, Final Fantasy VII artwork",
    wiki: "FFVII - Bugenhagen Artwork.jpg",
  },
  "characters/vincent": {
    alt: "Vincent in his Rebirth look, a red cloak around him and a golden claw for a left hand, gun raised.",
    title: "Vincent Valentine, Final Fantasy VII Rebirth render",
    wiki: "Vincent Valentine from FFVII Rebirth promo render.png",
  },
  "characters/vincent-og": {
    alt: "Vincent in the original's artwork, in a tattered red cloak and headband, gun in hand.",
    title: "Vincent Valentine, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Vincent-FFVIIArt.png",
  },
  "characters/cid": {
    alt: "Cid in his Rebirth look, arms folded, in a denim jacket with goggles on his head.",
    title: "Cid Highwind, Final Fantasy VII Rebirth render",
    wiki: "Cid Highwind from FFVII Rebirth promo render.png",
  },
  "characters/cid-og": {
    alt: "Cid in the original's artwork, goggles on his head, leaning on a long spear.",
    title: "Cid Highwind, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "CidHighwind-FFVIIArt.png",
  },
  "characters/rude": {
    alt: "Rude in his Remake look, bald, in a black suit and gloves.",
    title: "Rude, Final Fantasy VII Remake render",
    wiki: "FF7 Remake Rude Full Body Render.png",
  },
  "characters/rude-og": {
    alt: "Rude in the original's artwork, bald and in sunglasses, in a blue suit.",
    title: "Rude, Final Fantasy VII artwork",
    artist: NOMURA,
    wiki: "Rude Artwork.png",
  },
  "characters/elena": {
    alt: "Elena in her Rebirth look, blonde, in a dark suit, one hand raised.",
    title: "Elena, Final Fantasy VII Rebirth render",
    wiki: "Elena from FFVII Rebirth promo render.png",
  },
  "characters/reeve": {
    alt: "Reeve in his Remake look, bearded, in a dark pinstriped suit and red tie.",
    title: "Reeve Tuesti, Final Fantasy VII Remake render",
    wiki: "Reeve Tuesti from Final Fantasy VII Remake render.png",
  },
  "characters/scarlet": {
    alt: "Scarlet in her Remake look, blonde, in a long red dress, hand on her hip.",
    title: "Scarlet, Final Fantasy VII Remake render",
    wiki: "Scarlet from Final Fantasy VII Remake render.png",
  },
  "characters/biggs": {
    alt: "Biggs in his Remake look, in a red headband and green fatigues, pistol in hand.",
    title: "Biggs, Final Fantasy VII Remake render",
    wiki: "Biggs FFVII Remake.png",
  },
  "characters/biggs-og": {
    alt: "Biggs in the original's concept art, in a red headband, green shirt and big red gloves.",
    title: "Biggs, Final Fantasy VII concept art",
    wiki: "Biggs from FFVII concept art.png",
  },
  "characters/wedge": {
    alt: "Wedge in his Remake look, in a red bandana, a grenade launcher on his shoulder, thumbs up.",
    title: "Wedge, Final Fantasy VII Remake render",
    wiki: "Wedge FFVII Remake.png",
  },
  "characters/wedge-og": {
    alt: "Wedge in the original's concept art, round, in a red bandana and shoulder pads.",
    title: "Wedge, Final Fantasy VII concept art",
    wiki: "Wedge from FFVII concept art.png",
  },
  "characters/marlene": {
    alt: "Marlene in her Remake look, a little girl in a pink dress with a yellow bow.",
    title: "Marlene Wallace, Final Fantasy VII Remake render",
    wiki: "Marlene Wallace from FFVII Remake render.png",
  },
  "characters/dyne": {
    alt: "Dyne in his Rebirth look, scarred and stubbled, a gun grafted where his left hand was.",
    title: "Dyne, Final Fantasy VII Rebirth render",
    wiki: "Dyne from FFVII Rebirth promo render.png",
  },
  "characters/sonon": {
    alt: "Sonon in his INTERmission look, in a grey waistcoat and red gauntlets, holding a long staff.",
    title: "Sonon Kusakabe, Final Fantasy VII Remake Intergrade (INTERmission) render",
    wiki: "Sonon Kusakabe from FFVII Remake promo render.png",
  },
  "places/midgar-concept": {
    alt: "Midgar at night from above: the round city on its plate, reactors venting green light around the Shinra Building at its heart.",
    title: "Midgar concept art, Final Fantasy VII",
    wiki: "Midgar FFVII Concept Art.jpg",
  },
  "places/sector-7": {
    alt: "The Sector 7 slums beneath the plate, lit by lamps and wires, the support pillar towering over them.",
    title: "Sector 7 pillar concept art, Final Fantasy VII Remake",
    wiki: "Sector 7 Pillar artwork for Final Fantasy VII Remake.png",
  },
  "places/wall-market": {
    alt: "Wall Market at night: crowded lanterns and neon signs in a deep street under the plate.",
    title: "Wall Market concept art, Final Fantasy VII Remake",
    wiki: "Wall Market artwork 2 for Final Fantasy VII Remake.png",
  },
  "places/shinra-lobby": {
    alt: "The Shinra Building's lobby: a tall atrium of steel and glass, banners hanging, displays glowing.",
    title: "Shinra HQ lobby concept art, Final Fantasy VII Remake",
    wiki: "Shinra HQ lobby concept art FFVII Remake.png",
  },
  "places/hojo-lab": {
    alt: "Hojo's laboratory: tall specimen tanks glowing green in a dark, cluttered room.",
    title: "Hojo's laboratory concept art, Final Fantasy VII Remake",
    wiki: "Hojo's Laboratory artwork for Final Fantasy VII Remake.png",
  },

  "places/corneo-mansion": {
    alt: "Don Corneo's mansion at night, its tiered red-lit roofs rising over Wall Market.",
    title: "Corneo's mansion concept art, Final Fantasy VII Remake",
    wiki: "Corneo's Mansion artwork for Final Fantasy VII Remake.png",
  },
  "places/expressway": {
    alt: "Cloud on his motorbike speeding down a dark elevated expressway.",
    title: "Midgar expressway concept art, Final Fantasy VII Remake",
    wiki: "Midgar Expressway artwork 3 for Final Fantasy VII Remake.png",
  },
  "places/junon": {
    alt: "Junon at dusk: the great cannon jutting out over the sea from its fortified cliff.",
    title: "Junon CG artwork, Final Fantasy VII",
    wiki: "Junon FFVII CG Art 1.jpg",
  },
  "places/northern-crater": {
    alt: "A sketch of the Northern Crater with the Lifestream erupting upward from its heart.",
    title: "Northern Crater Lifestream sketch, Final Fantasy VII",
    wiki: "Northern Crater Lifestream Eruption FFVII Sketch.jpg",
  },
  "places/shinra-mansion": {
    alt: "The Shinra Mansion's ruined hall in teal shadow, light falling through three tall windows above a staircase.",
    title: "Shinra Mansion concept art, Dirge of Cerberus -Final Fantasy VII-",
    wiki: "DoC Shinra Mansion 1 Artwork.png",
  },
  "places/sector-8": {
    alt: "Sector 8 just after the bombing: fires burning in the dark street beneath the reactor's towers.",
    title: "Sector 8 concept art, Final Fantasy VII Remake",
    wiki: "Sector 8 artwork for FFVII Remake.png",
  },
  "places/upper-sector-7": {
    alt: "A wet street on the upper plate of Sector 7 at night, lit by lamps and a glowing billboard.",
    title: "Upper Sector 7 concept art, Final Fantasy VII Remake",
    wiki: "Upper Sector 7 artwork for Final Fantasy VII Remake.png",
  },
  "places/president-office": {
    alt: "President Shinra's office: a long red carpet between lit columns, leading to his desk.",
    title: "President's office concept art, Final Fantasy VII Remake",
    wiki: "President-Office-Shinra-HQ-FFVIIR-Art.jpg",
  },
  "moments/second-chance-meeting": {
    alt: "Aerith standing over Cloud among the white and yellow flowers of the Sector 5 church, where he has fallen through the roof.",
    title: "Aerith and Cloud in the church, Final Fantasy VII Remake (in-game still)",
    wiki: "Second Chance Meeting from FFVII Remake.png",
  },
  "moments/yuffie-sonon": {
    alt: "Yuffie and Sonon back to back inside the Shinra Building, weapons ready.",
    title: "Yuffie and Sonon, Final Fantasy VII Remake Intergrade (Square Enix promo screenshot)",
    wiki: "FFVII Remake Intergrade promo 3.png",
  },
  "moments/jenova-emergent": {
    alt: "Jenova Emergent rising in the dark hold of the ship: a swollen blue mass on spindly limbs, a skull-like face at its centre.",
    title: "Jenova Emergent appears, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Jenova Emergent appears from FFVII Rebirth.png",
  },
  "moments/ifalna-death": {
    alt: "Ifalna lying dying at a Midgar station in the rain-dim light, young Aerith beside her as Elmyra comes near.",
    title: "Ifalna's death, Final Fantasy VII Remake (in-game still)",
    wiki: "Ifalna's death from Final Fantasy VII Remake.png",
  },
  "moments/calamity-meteorite": {
    alt: "A blazing meteorite streaking across a starry sky over the clouds, watched from a high peak.",
    title: "The meteorite that brought Jenova, Final Fantasy VII Remake (in-game still)",
    wiki: "Meteorite that destroyed the Cetra from FFVII Remake.png",
  },
  "moments/sephiroth-black-materia": {
    alt: "Sephiroth holding the black materia aloft on a stone causeway in the Temple of the Ancients, Cloud and the party behind him.",
    title: "Sephiroth holds the black materia, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Sephiroth and the black materia from FFVII Rebirth.png",
  },
  "places/midgar-remake": {
    alt: "Midgar's upper plate: expressways and pipes winding between tall towers in a pale haze.",
    title: "Midgar, Final Fantasy VII Remake (trailer still)",
    wiki: "Midgar-FFVII-Remake.png",
  },
  "places/nibelheim-rebirth": {
    alt: "Nibelheim's square at dusk: timbered houses, the water tower and the stairs up to the Shinra Mansion.",
    title: "Nibelheim, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Nibelheim in chapter 1 from FFVII Rebirth.png",
  },
  "places/cosmo-canyon-torch": {
    alt: "Aerith at the great torch of Cosmo Canyon at night, robed elders with lanterns on either side.",
    title: "The torch of Cosmo Canyon, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Aerith at Cosmo Canyon's Torch from FFVII Rebirth.png",
  },
  "places/northern-crater-ending": {
    alt: "The Northern Crater in the dark, the Lifestream rising from it in pale green columns.",
    title: "The Northern Crater, Final Fantasy VII (frame from the game's movie)",
    wiki: "NorthCrater-ffvii-ending.png",
  },
  "places/church-remake": {
    alt: "Inside the Sector 5 church: light falling through tall windows onto Aerith's flower bed among broken pews.",
    title: "The Sector 5 church, Final Fantasy VII Remake (screenshot)",
    wiki: "Sector 5 Church from FFVII Remake.jpg",
  },
  "places/forgotten-capital-rebirth": {
    alt: "The Forgotten Capital: shell-like towers and coral spires rising over still blue water.",
    title: "The Forgotten Capital, Final Fantasy VII Rebirth (in-game still)",
    wiki: "The Forgotten Capital from FFVII Rebirth.png",
  },
  "places/junon-rebirth": {
    alt: "Junon on its cliff over the sea, the great cannon, the Sister Ray, jutting into a blue sky.",
    title: "Junon and the Sister Ray, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Junon and the Sister Ray in FFVII Rebirth.png",
  },
  "places/temple-of-the-ancients": {
    alt: "The Temple of the Ancients: a stepped stone pyramid rising from mist-covered jungle.",
    title: "The Temple of the Ancients, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Temple of the Ancients from FFVII Rebirth.png",
  },
  "groups/avalanche-faction": {
    alt: "AVALANCHE fighters in combat gear firing on Shinra under floodlights.",
    title: "AVALANCHE in action, Final Fantasy VII Remake (in-game still)",
    wiki: "Avalanche Faction from FFVII Remake.png",
  },
  "groups/shinra-meeting": {
    alt: "Shinra's executives around the long boardroom table, President Shinra at its head.",
    title: "The Shinra board meeting, Final Fantasy VII Remake (in-game still)",
    wiki: "Shinra executive meeting room from FFVII Remake.jpg",
  },
  "groups/wutai-troops": {
    alt: "A Wutai soldier in samurai-style armour on a fortress wall at night, a fierce guardian statue behind him.",
    title: "Wutai's soldiers, Crisis Core -Final Fantasy VII- Reunion (in-game still)",
    wiki: "Wutai troops.png",
  },
  "moments/meteor-midgar": {
    alt: "Meteor striking Midgar: a blinding wall of fire engulfing the Shinra Building's tower.",
    title: "Meteor descends on Midgar, Final Fantasy VII Remake (in-game still)",
    wiki: "Meteor descending upon the Shinra Building from FFVII Remake.png",
  },
  "moments/reactor-5-trap": {
    alt: "Cloud in close-up, hanging on in Mako Reactor 5 as it is about to blow, Tifa and Barret behind him.",
    title: "Cloud hangs on in Mako Reactor 5, Final Fantasy VII Remake (in-game still)",
    wiki: "Cloud hanging in Mako Reactor 5 from FFVII Remake.png",
  },
  "moments/scorpion-sentinel": {
    alt: "The fight with the Scorpion Sentinel in Mako Reactor 1: the great machine firing among twisted girders.",
    title: "Scorpion Sentinel battle concept art, Final Fantasy VII Remake",
    wiki: "Scorpion Sentinel battle artwork for FFVII Remake.png",
  },
  "moments/aerith-altar": {
    alt: "Cloud holding Aerith close at the altar in the Forgotten Capital, green motes of the Lifestream drifting around them.",
    title: "Cloud and Aerith at the altar, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Cloud and Aerith in the ending from FFVII Rebirth.png",
  },
  "moments/sephiroth-reborn": {
    alt: "Cloud, sword raised, facing Sephiroth Reborn, a towering winged form, among floating rocks at the edge of creation.",
    title: "Cloud faces Sephiroth Reborn, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Sephiroth Reborn in edge of creation from FFVII Rebirth.png",
  },
  "moments/nanaki-seto": {
    alt: "Seto, turned to stone, silhouetted against a full moon, with Nanaki on the rocks below.",
    title: "Nanaki finds Seto, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Nanaki finds Seto from FFVII Rebirth.png",
  },
  "moments/lifestream": {
    alt: "Cloud and Tifa falling into the glowing green Lifestream amid the wreckage of Mideel.",
    title:
      "Cloud and Tifa fall into the Lifestream, Final Fantasy VII (frame from the game's movie)",
    wiki: "Lifestream-ffvii-fmv-falling.png",
  },
  "places/kalm": {
    alt: "Kalm in Rebirth: timbered houses and shop awnings around a stone stairway, under a bright sky.",
    title: "Kalm, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Kalm from FFVII Rebirth.png",
  },
  "places/gold-saucer": {
    alt: "The Gold Saucer's entrance hall in Rebirth: a crowd under a glowing pink and gold archway and palm trees.",
    title: "The Gold Saucer's entrance, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Gold Saucer entrance from FFVII Rebirth.png",
  },
  "places/gongaga": {
    alt: "Gongaga's memorial to the reactor's victims: a stone plinth ringed with pink flowers, jungle behind it.",
    title: "The Gongaga memorial, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Gongaga memorial from FFVII Rebirth.png",
  },
  "places/gongaga-reactor": {
    alt: "The wrecked Gongaga reactor rising over the jungle, its tower broken and overgrown.",
    title: "The Gongaga mako reactor, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Gongaga mako reactor from FFVII Rebirth.png",
  },
  "places/costa-del-sol": {
    alt: "Costa del Sol's mayor, in a flowered shirt, welcoming the beach crowd under palm trees.",
    title: "Kapono welcomes everyone to Costa del Sol, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Kapono welcomes everyone to Costa del Sol from FFVII Rebirth.png",
  },
  "places/mythril-mine": {
    alt: "A dim cavern in the Mythril Mine, blue crystals glowing beside old mining scaffolds.",
    title: "The Mythril Mine, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Mythril Mines from FFVII Rebirth.png",
  },
  "places/shinra-manor": {
    alt: "The Shinra Manor's dark basement library, lamps glowing over shelves and a desk of books.",
    title: "The Shinra Manor library, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Shinra Manor library from FFVII Rebirth.png",
  },
  "places/corel-prison": {
    alt: "A man of Corel Prison in a yellow jacket leaning close under a ring of lights, welcoming newcomers.",
    title:
      "Garth welcomes Cloud's party to Corel Prison, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Garth welcomes Cloud's party to Corel Prison from FFVII Rebirth.png",
  },
  "places/sleeping-forest": {
    alt: "The Sleeping Forest seen from above in the original: fallen trunks and pale rock among the trees.",
    title: "The Sleeping Forest, Final Fantasy VII (screenshot)",
    wiki: "Sleeping forest.png",
  },
  "places/train-graveyard": {
    alt: "The Train Graveyard in Remake: rows of abandoned carriages in blue gloom, Cloud standing on one.",
    title: "The Train Graveyard, Final Fantasy VII Remake (in-game still)",
    wiki: "Train Graveyard Section A from FFVII Remake.jpg",
  },
  "places/under-junon": {
    alt: "The beach at Under Junon in the original, the party gathered round a girl lying on the sand by the sea wall.",
    title: "Under Junon's beach, Final Fantasy VII (screenshot)",
    wiki: "Mouth to Mouth.png",
  },
  "places/corel": {
    alt: "North Corel in the original: shacks of scrap metal on a dusty hillside, with a sign for the Gold Saucer.",
    title: "North Corel, Final Fantasy VII (screenshot)",
    wiki: "North Corel.jpg",
  },
  "places/rocket-town": {
    alt: "Rocket Town in the original: timber houses below the grounded Shinra rocket, leaning against its launch tower.",
    title: "Rocket Town, Final Fantasy VII (screenshot)",
    wiki: "RocketTown.jpg",
  },
  "moments/clouds-story-at-kalm": {
    alt: "The party in a lamplit room at the Kalm inn, gathered around a table to hear Cloud's story.",
    title: "The party in the Kalm inn, Final Fantasy VII Rebirth (in-game still)",
    wiki: "The party in Kalm inn from FFVII Rebirth.png",
  },
  "moments/turks-in-mythril-mine": {
    alt: "Barret and Red XIII in the Mythril Mine, facing Rude and Elena across the cavern.",
    title: "The Turks at the Mythril Mine, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Turks at the Mythril Mines from FFVII Rebirth.png",
  },
  "moments/hojo-at-costa-del-sol": {
    alt: "Hojo in a white coat on the sunny promenade at Costa del Sol, the party and beachgoers around him.",
    title: "Hojo in Costa del Sol, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Hojo in Costa del Sol from FFVII Rebirth.png",
  },
  "moments/keystone-stolen": {
    alt: "Cait Sith holding out the round keystone to Tseng, who reaches down for it.",
    title: "Cait Sith gives the keystone to Tseng, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Cait Sith gives the keystone to Tseng from FFVII Rebirth.png",
  },
  "moments/aerith-dream": {
    alt: "Aerith standing alone in a misty green forest, light falling between tall trees.",
    title: "Voice from the Sleeping Forest, Final Fantasy VII Ever Crisis wallpaper",
    wiki: "Home Wallpaper Voice from the Sleeping Forest from FFVIIEC.png",
  },
  "moments/junon-gas-chamber": {
    alt: "Junon's gas chamber in the original: a dim metal cell, lit by two lamps, where Tifa is to be executed.",
    title: "Junon's gas chamber, Final Fantasy VII (screenshot)",
    wiki: "Junon gas chamber.png",
  },
  "moments/shocking-reunion": {
    alt: "Mideel's clinic in the original: Cloud slumped in a wheelchair, Tifa before him, the doctor and a nurse beside them.",
    title: "Tifa finds Cloud in Mideel, Final Fantasy VII (screenshot)",
    wiki: "Shocking Reunion from FFVII.png",
  },
  "moments/shinra-submarine": {
    alt: "Shinra's red submarine, with fins like wings and a railed conning tower.",
    title: "Submarine concept artwork, Final Fantasy VII",
    wiki: "FFVII-Submarine.jpg",
  },
  "moments/shinra-no-26": {
    alt: "The Shinra No. 26 rocket: a bundle of rust-brown boosters drifting in dark space.",
    title: "Shinra No. 26 model, Final Fantasy VII (from the 25th Anniversary Ultimania)",
    wiki: "Shinra 26 Rocket FFVII Model.jpg",
  },
  "moments/white-materia": {
    alt: "The water altar in the Forgotten Capital, glowing blue, with Aerith's White Materia on its steps.",
    title: "The White Materia at the altar, Final Fantasy VII (frame from the game's movie)",
    wiki: "WaterAltar-ffvii-fmv-white.png",
  },
  "moments/diamond-weapon": {
    alt: "Diamond Weapon, a great armoured beast, firing bolts of light from its body.",
    title: "Diamond Weapon attacks, Final Fantasy VII (frame from the game's movie)",
    wiki: "DiamondWeapon-ffvii-fmv-attack.png",
  },
  "moments/sister-ray": {
    alt: "The Sister Ray's barrel gathering a swirl of purple and blue energy before it fires.",
    title: "The Sister Ray charges, Final Fantasy VII (frame from the game's movie)",
    wiki: "SisterRay-ffvii-fmv-charge.png",
  },
  "moments/highwind-boosters": {
    alt: "The Highwind's rear engines firing as the airship sets off.",
    title: "The Highwind's boosters, Final Fantasy VII (frame from the game's movie)",
    wiki: "Highwind-ffvii-fmv-jet.png",
  },
  "moments/northern-cave": {
    alt: "The party, small on a floating island of green rock, deep inside the Northern Cave where the Lifestream glows.",
    title: "The Northern Cave, Final Fantasy VII Ever Crisis (in-game still)",
    wiki: "Northern Cave Dungeon Infobox Image.png",
  },
  "places/mideel": {
    alt: "Mideel in the original: timber houses and a windmill joined by wooden walkways in a tropical forest.",
    title: "Mideel, Final Fantasy VII (screenshot)",
    wiki: "FFVII-Mideel.jpg",
  },
  "places/fort-condor": {
    alt: "Fort Condor: a giant condor nesting on an egg atop an old reactor on a rocky peak.",
    title: "Fort Condor concept art, Final Fantasy VII (from the 25th Anniversary Ultimania)",
    wiki: "Fort Condor FFVII Concept Art.jpg",
  },
  "moments/gateway-to-heaven": {
    alt: "The Gateway to Heaven in the original: a dim stone room at the Gold Saucer with chains on the walls and a round hole in the floor.",
    title: "The Gateway to Heaven, Final Fantasy VII (screenshot)",
    wiki: "Gateway to heaven.png",
  },
  "moments/aerith-tseng-marlene": {
    alt: "Tseng in a doorway lit by fire, a Shinra trooper behind him, facing Aerith, who keeps a hand on Marlene's head.",
    title: "Tseng finds Aerith and Marlene, Final Fantasy VII Remake (in-game still)",
    wiki: "FFVIIR Aerith Tseng Marlene angle.png",
  },
  "moments/old-corel": {
    alt: "Corel before it burned, in the original: timber houses, a water tower and the Mine Pub on a dusty street at dusk.",
    title: "Old Corel, Final Fantasy VII (screenshot)",
    wiki: "Old Corel.jpg",
  },
  "moments/dyne-attacks": {
    alt: "Dyne in the desert below the Gold Saucer, teeth bared, raising the gun grafted to his arm.",
    title: "Dyne attacks, Final Fantasy VII Rebirth (in-game still)",
    wiki: "Dyne attacks from FFVII Rebirth.png",
  },
};

/** An image's description and credit. */
export function detailsFor(entry: ArtEntry): ArtDetails {
  const details = DETAILS[entry.id];
  if (!details) throw new Error(`no details for ${entry.id}`);
  return { artist: SE, ...details };
}

/** Its page on the Final Fantasy Wiki, for the credit. */
export function artSourceUrl(credit: ArtDetails): string | undefined {
  if (credit.wiki === undefined) return undefined;
  return `https://finalfantasy.fandom.com/wiki/File:${encodeURIComponent(credit.wiki.replaceAll(" ", "_"))}`;
}

/** The IDs that have details, so a test can match them to the manifest. */
export const DESCRIBED: readonly string[] = Object.keys(DETAILS);
