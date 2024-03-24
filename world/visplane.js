class Visplane {
    constructor(screenWidth) {
        this.height = 0;
        this.picnum = 0;
        this.lightLevel = 0;
        this.minx = 0;
        this.maxx = 0;
        this.top = new Array(screenWidth).fill(Number.MAX_VALUE);
        this.bottom = new Array(screenWidth).fill(Number.MIN_VALUE);
    }

    // clear() {
    //     this.top.fill(Number.MAX_VALUE);
    //     this.bottom.fill(Number.MIN_VALUE);
    // }
}