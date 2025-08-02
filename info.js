const MF_SPECIAL = 1;
// Blocks.
const MF_SOLID = 2;
// Can be hit.
const MF_SHOOTABLE = 4;
// Don't use the sector links (invisible but touchable).
const MF_NOSECTOR = 8;
// Don't use the blocklinks (inert but displayable)
const MF_NOBLOCKMAP = 16;

// Not to be activated by sound, deaf monster.
const MF_AMBUSH = 32;
// Will try to attack right back.
const MF_JUSTHIT = 64;
// Will take at least one step before attacking.
const MF_JUSTATTACKED = 128;
// On level spawning (initial position),
//  hang from ceiling instead of stand on floor.
const MF_SPAWNCEILING = 256;
// Don't apply gravity (every tic),
//  that is, object will float, keeping current height
//  or changing it actively.
const MF_NOGRAVITY = 512;

// Movement flags.
// This allows jumps from high places.
const MF_DROPOFF = 0x400;
// For players, will pick up items.
const MF_PICKUP = 0x800;
// Player cheat. ???
const MF_NOCLIP = 0x1000;
// Player: keep info about sliding along walls.
const MF_SLIDE = 0x2000;
// Allow moves to any height, no gravity.
// For active floaters, e.g. cacodemons, pain elementals.
const MF_FLOAT = 0x4000;
// Don't cross lines
//   ??? or look at heights on teleport.
const MF_TELEPORT = 0x8000;
// Don't hit same species, explode on block.
// Player missiles as well as fireballs of various kinds.
const MF_MISSILE = 0x10000;
// Dropped by a demon, not level spawned.
// E.g. ammo clips dropped by dying former humans.
const MF_DROPPED = 0x20000;
// Use fuzzy draw (shadow demons or spectres),
//  temporary player invisibility powerup.
const MF_SHADOW = 0x40000;
// Flag: don't bleed when shot (use puff),
//  barrels and shootable furniture shall not bleed.
const MF_NOBLOOD = 0x80000;
// Don't stop moving halfway off a step,
//  that is, have dead bodies slide down all the way.
const MF_CORPSE = 0x100000;
// Floating to a height for a move, ???
//  don't auto float to target's height.
const MF_INFLOAT = 0x200000;
// On kill, count this enemy object
//  towards intermission kill total.
// Happy gathering.
const MF_COUNTKILL = 0x400000;

// On picking up, count this item object
//  towards intermission item total.
const MF_COUNTITEM = 0x800000;

// Special handling: skull in flight.
// Neither a cacodemon nor a missile.
const MF_SKULLFLY = 0x1000000;

// Don't spawn this object
//  in death match mode (e.g. key cards).
const MF_NOTDMATCH = 0x2000000;

// Player sprites in multiplayer modes are modified
//  using an internal color lookup table for re-indexing.
// If 0x4 0x8 or 0xc,
//  use a translation table for player colormaps
const MF_TRANSLATION = 0xc000000;
// Hmm ???.
const MF_TRANSSHIFT = 26;



