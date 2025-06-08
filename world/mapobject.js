class MapObject {
  constructor(x, y, z, type, levelManager) {
    Object.assign(this, { x, y, z, type, levelManager });

    let info = gameEngine.infoDefinitions[type];

    this.radius = info.radius;
    this.height = info.height;
    this.flags = info.flags;
    this.health = info.spawnhealth;

    this.angle;

    let stateName = info.spawnstate;
    let state = this.findState(stateName);

    this.state = state;
    this.sprite = state[0];
    this.frame = state[1];
    this.tics = state[2];

    levelManager.setThingPosition(this);

    this.floorz = this.subsector.sector.floorHeight;
    this.ceilingz = this.subsector.sector.ceilingHeight;

    if (z == ONFLOORZ) {
      this.z = this.floorz;
    } else if (z == ONCEILINGZ) {
      this.z = this.ceilingz - info.height;
    } else {
      this.z = z;
    }
  }

  findState(stateName) {
    for (let key in gameEngine.states) {
      if (stateName == key) {
        let state = gameEngine.states[key];
        return state;
      }
    }
  }
  update() {
    this.tics--;
    if (this.tics <= 0) {
      let stateName = this.state[4];
      let state = this.findState(stateName);

      this.state = state;
      this.sprite = state[0];
      this.frame = state[1];
      this.tics = state[2];
    }
  }

  draw(ctx) {
    drawDebugText(
      5,
      20,
      `Tics: ${this.tics} state: ${this.state[4]}`,
      [255, 255, 0]
    );
  }
}
