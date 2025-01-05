const gameEngine = new GameEngine("myCanvas", 50);

const ENDIAN = (() => {
  const buffer = new ArrayBuffer(2);
  new DataView(buffer).setInt16(0, 256, true /* littleEndian */);
  return new Int16Array(buffer)[0] === 256;
})();

let levelSelect = document.getElementById("levels");

let selectedValue = "E1M1";
levelSelect.addEventListener("change", function () {
  selectedValue = this.value;
  console.log("Selected level:", selectedValue);
});

document
  .getElementById("fileInput")
  .addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.error("No file selected.");
      return;
    }

    // identify version
    let gameMission = GameMission.doom;
    let gameMode = "";
    if (gameMission === GameMission.doom) {
      gameMode = GameMode.shareware;
    }
    let startMap = 1;
    let startEpisode = 1;

    // need to setup the framebuffer/video buffer

    // ...

    // loop has started but still initializing

    // checking the gamemode
    // if gamemmode === commercial
    // else
    // switch gameepisode
    // case 1
    // these comments need to be changed into code but only doing SKY1 for now
    let skyTextureName = "SKY1";
    // might need a texture number for this name

    // G_DoLoadLevel
    //skyflatenum = R_FlatNumForName(SKYFLATNAME)

    // ....

    // setup level P_SetupLevel

    // *** need to more setup before regarding the file reading, parsing, lump loading, etc

    gameEngine.entities = [];

    gameEngine.skyTextureName = "SKY1";

    const wadFileReader = new WADFileReader(file);
    const arrayBuffer = await wadFileReader.readFile();
    const wadParser = new WADParser(arrayBuffer);
    const lumpData = await wadParser.parse();
    const levelParser = new LevelParser(lumpData);
    const levels = levelParser.parse(selectedValue);

    gameEngine.lumpData = lumpData;

    const palette = new ReadPalette(lumpData);

    gameEngine.palette = palette;

    const texture = new Textures(lumpData);

    gameEngine.textures = texture;

    let vertices = levels.vertices;
    let { maxX, minX, maxY, minY } = calculateMinMax(vertices);

    const { scaleX, scaleY } = calculateScale2D(maxX, minX, maxY, minY);

    const canvas = new Canvas("myCanvas");

    const player = new Player(
      levels.things[0],
      { minX: minX, minY: minY },
      { scaleX: scaleX, scaleY: scaleY },
      90,
      41
    );

    // let troop = lumpData.find((lump) => lump.name === "TROOA1");

    gameEngine.addEntity(player);
    gameEngine.player = player;

    gameEngine.canvas = canvas;
    gameEngine.ctx = canvas.ctx;

    const patchNames = new PatchNames(lumpData);
    gameEngine.patchNames = patchNames;

    const sectorObjects = buildSectors(levels.sectors);
    const sidedefObjects = buildSidedefs(levels.sidedefs, sectorObjects);

    const linedefObjects = buildLinedefs(
      levels.linedefs,
      vertices,
      sidedefObjects
    );

    const segObjects = buildSegs(levels.segs, vertices, linedefObjects);

    const thingObjects = buildThings(levels.things);

    const dataObjects = {
      sectorObjects,
      sidedefObjects,
      linedefObjects,
      segObjects,
      thingObjects,
    };

    // sector needs to have  a thing list of all the things in this sector
    // build things
    //
    //     // Thing definition, position, orientation and type,
    // // plus skill/visibility flags and attributes.
    // typedef PACKED_STRUCT (
    //   {
    //       short		x;
    //       short		y;
    //       short		angle;
    //       short		type;
    //       short		options;
    //   }) mapthing_t;

    // build the thing following this definition above
    // spawn the thing
    //  - inside, check if the thing is a player, spawn the player
    //  - setup gun sprite
    //  - bunch of player checks and other checks
    //  - finally, start looking at spawning monsters or other things
    //  - check to see if the thing is spawn on the ceiling?, else on the floor
    //  - actually, spawn the thing now by calling P_spawnmobj (spawn map object)
    //  - there is a map object, mobj, that gets properties set
    //  - set thing position, where subsector links are set
    //  - see if this thing is in the subsector? by looping over the number of nodes , and checking the side of where the thing is, return the subsector
    //  - set the things subsector to the subsector returned.
    //  - Don't add invisible things to the sector links (    // Don't use the sector links (invisible but touchable). MF_NOSECTOR		= 8,)
    //  - grab the sector referenced by the subsector?
    //  - thing is a linkedlist?
    //  - set thing-> prev to null
    //  - set thing->next to the sec->thinglist (beginning of list)
    //  - if the thing list exists, then set this sectors thinglists previous sprite(?) to thing
    //  - outside the if, set thinglist to thing --- sec->thinglist = thing
    //  - blockmap related code, ignore for now
    //  - set the floorz and ceilingz of the mobj, aka the floorheight and ceiling height of this mobj's subsectors floorheight or ceiling height
    //  - check the z of the mobj if its on the floor or if its on the ceiling
    //  - thinker related code

    const textureManager = new TextureManager(
      texture.maptextures,
      palette.palettes[0]
    );
    const flatManager = new FlatManager(lumpData, palette.palettes[0]);

    let sprites = flatManager.getFlatData(lumpData, "S_START", "S_END");

    startIndex = lumpData.findIndex((lump) => lump.name === "S_START") + 1;
    endIndex = lumpData.findIndex((lump) => lump.name === "S_END") - 1;

    let patch;
    let spriteWidth = [];
    let spriteOffset = [];
    let spriteTopOffset = [];
    for (let i = 0; i < sprites.length; i++) {
      patch = patchNames.parsePatchHeader(sprites[i].name);
      spriteWidth[i] = patch.width;
      spriteOffset[i] = patch.leftOffset;
      spriteTopOffset[i] = patch.topOffset;
    }

    let troop = lumpData.find((lump) => lump.name === "TROOA1");

    // let spriteName = sprites.find((sprite) =>
    //   sprite.name.startsWith(spriteNames[0])
    // );

    let spriteName;
    let frame;
    let rotation;
    // for (let sprite of sprites) {
    //   if (sprite.name.startsWith(spriteNames[0])) {
    //     spriteName = sprite;
    //     frame = sprite.name[4].charCodeAt(0) - "A".charCodeAt(0);
    //     rotation = sprite.name[5] - "0";

    //     // install sprite

    //     installSpriteLump(sprite, frame, rotation, false);

    //     if (sprite.name.length > 6) {
    //       if (sprite.name[6]) {
    //         frame = sprite.name[6].charCodeAt(0) - "A".charCodeAt(0);
    //         rotation = sprite.name[7] - "0";
    //         // install sprite

    //         installSpriteLump(sprite, frame, rotation, true);
    //       }
    //     }
    //   }
    // }

    startIndex--;
    endIndex++;

    for (let i = 0; i < spriteNames.length; i++) {
      for (let j = startIndex + 1; j < endIndex; j++) {
        let sprite = lumpData[j].name;
        console.log(sprite);
        if (sprite.startsWith(spriteNames[0])) {
          spriteName = sprite;
          frame = sprite[4].charCodeAt(0) - "A".charCodeAt(0);
          rotation = sprite[5] - "0";

          // install sprite

          installSpriteLump(j, frame, rotation, false);

          if (sprite.length > 6) {
            if (sprite[6]) {
              frame = sprite[6].charCodeAt(0) - "A".charCodeAt(0);
              rotation = sprite[7] - "0";
              // install sprite

              installSpriteLump(j, frame, rotation, true);
            }
          }
        }
      }
      maxFrame++;

      theSprites[i].framesCount = maxFrame;
      theSprites[i].spriteFrames = spriteTemp;
    }

    const levelManager = new LevelManager(
      levels,
      dataObjects,
      textureManager,
      flatManager
    );
    gameEngine.levelManager = levelManager;
    gameEngine.init();

    gameEngine.start();
  });
