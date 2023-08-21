class ColorGenerator {
  constructor(sidedefObjects) {
    this.colors = new Map();

    this.palette = gameEngine.palette.palettes[0];


  }

  getColor(tex, lightLevel) {
    const strLight = lightLevel.toString();
    const key = tex + strLight;

    if (!this.colors.has(key)) {
      const texId = simpleHash(tex);
      const l = lightLevel / 255;

      const rng = [0, 255];


      const index = getRandomInt(...rng, texId);
      const color = [
        this.palette[index].red * l,
        this.palette[index].green * l,
        this.palette[index].blue * l,
      ];

      this.colors.set(key, color);
    }

    return this.colors.get(key);
  }
}
