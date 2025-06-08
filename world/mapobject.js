class MapObject {
  constructor(x, y, z, type, levelManager) {
    Object.assign(this, { x, y, z, type, levelManager });

    let info = gameEngine.infoDefinitions[type];

    this.radius = info.radius;
    this.height = info.height;
    this.flags = info.flags;
    this.health = info.spawnhealth;

    this.angle;

    this.stateName = info.spawnstate;
    let state = gameEngine.states[this.stateName];

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

    this.ticTimer = 0;
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
    if (this.tics <= 0) {
      return;
    }
    this.ticTimer += gameEngine.clockTick;
    while (this.ticTimer >= 1 / 35) {
      this.ticTimer -= 1 / 35;
      this.tics--;
      if (this.tics <= 0) {
        this.changeState();
      }
    }
  }

  changeState() {
    this.stateName = this.state[4];
    let state = gameEngine.states[this.stateName];

    this.state = state;
    this.sprite = state[0];
    this.frame = state[1];
    this.tics = state[2];

    let actionName = this.state[3];
    if (actionName !== "NULL") {
      // drawDebugText(5, 5, `performing action: ${actionName}`, [255, 255, 0]);
      let fn = gameEngine.actions[actionName];
      if (typeof fn === "function") {
        fn(this);
      }
    }
  }

  draw(ctx) {}
}
