class SpriteFrame {
  constructor() {
    this.rotate = true;
    this.lump = new Array(8);
    this.flip = new Array(8);

    this.flip.fill(255);
    this.lump.fill(-1);
  }
}
