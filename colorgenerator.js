class ColorGenerator {
  constructor(sidedefObjects) {
    this.colors = new Map();
    for (let i = 0; i < sidedefObjects.length; i++) {
      if (!this.colors.has(sidedefObjects[i].middleTexture)) {
        this.colors.set(sidedefObjects[i].middleTexture, [
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256),
        ]);
      }
    }
  }

  getColor(tex, lightLevel) {
    const strLight = lightLevel.toString();
    const key = tex + strLight;

    if (!this.colors.has(key)) {
      const texId = simpleHash(tex);
      const l = lightLevel / 255;

      const rng = [50, 256];
      const color = [
        getRandomInt(...rng, texId) * l,
        getRandomInt(...rng, texId + 1) * l,
        getRandomInt(...rng, texId + 2) * l,
      ];

      this.colors.set(key, color);
    }

    return this.colors.get(key);
  }
}
