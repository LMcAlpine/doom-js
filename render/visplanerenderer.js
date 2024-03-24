class VisplaneRenderer {
    constructor() {

        this.visplanes = new Array(512).fill(null).map(() => new Visplane(640));
        this.lastVisplane = 0;
        this.floorplane = 0;
        this.ceilingplane = 0;
        this.lastopening = 0;

        this.baseXScale = 0;
        this.baseYScale = 0;
    }

    clearPlanes(playerAngle) {
        this.lastVisplane = 0;
        this.lastopening = 0;
        this.floorplane = 0;
        this.ceilingplane = 0;

        this.baseXScale = Math.cos((degreesToRadians(playerAngle - 90))) / (HALFWIDTH);
        this.baseYScale = -(Math.sin(degreesToRadians(playerAngle - 90)) / HALFWIDTH);


    }

    findPlane(height, picnum, skynum, lightLevel) {
        if (picnum === skynum) {
            height = 0;
            lightLevel = 0;
        }

        for (let i = 0; i < this.lastVisplane; i++) {
            let plane = this.visplanes[i];
            if (plane.height === height && plane.picnum === picnum && plane.lightLevel === lightLevel) {
                return i;
            }
        }

        if (this.lastVisplane < this.visplanes.length) {
            this.lastVisplane++;
        }
        else {
            throw new Error("Out of visplanes");
        }

        let newPlane = this.visplanes[this.lastVisplane];
        newPlane.height = height;
        newPlane.picnum = picnum;
        newPlane.lightLevel = lightLevel;
        newPlane.minx = 640;
        newPlane.maxx = 0;
        return this.lastVisplane;
    }

    checkPlane(start, stop, planeIndex) {
        let plane = this.visplanes[planeIndex];

        let intrl;
        let unionl;
        if (start < plane.minx) {
            intrl = plane.minx;
            unionl = start;
        }
        else {
            intrl = start;
            unionl = plane.minx;
        }

        let intrh;
        let unionh;
        if (stop > plane.maxx) {
            intrh = plane.maxx;
            unionh = stop;
        }
        else {
            intrh = stop;
            unionh = plane.maxx;
        }

        if (intrh <= intrl) {
            plane.minx = unionl;
            plane.maxx = unionh;
            return planeIndex;
        }

        for (let i = Math.floor(intrl); i <= 640; i++) {
            if (i >= intrh) {
                plane.minx = unionl;
                plane.maxx = unionh;
                return planeIndex;
            }
            if (plane.top[i] !== Number.MAX_VALUE) {
                break;
            }
        }

        if (this.lastVisplane === this.visplanes.length - 1) {
            throw new Error("No more visplanes used " + this.lastVisplane);
        }

        this.lastVisplane += 1;
        let newPlane = { ...plane, minx: start, maxx: stop, top: new Array(640).fill(Number.MAX_VALUE) };

        this.visplanes[this.lastVisplane] = newPlane;

        return this.lastVisplane;
    }

    drawPlanes() {
        this.visplanes.forEach((plane) => {
            if (plane.minx > plane.maxx) {
                return;
            }

            if (plane.picnum === "F_SKY1") {
                // draw sky
            }
            else {
                this.drawRegularPlane(plane);
            }

        })
    }

    drawRegularPlane(plane) {
        // for (let x = plane.minx; x <= plane.maxx; x++) {
        // const t1 = plane.top[x];
        // const b1 = plane.bottom[x];

        // const t2 = x < plane.maxx ? plane.top[x + 1] : t1;
        // const b2 = x < plane.maxx ? plane.bottom[x + 1] : b1;
        if (plane.maxx < plane.top.length) {
            plane.top[plane.maxx] = Number.MAX_VALUE;
        }
        if (plane.minx > 0) {
            plane.top[plane.minx] = Number.MAX_VALUE;
        }

        plane.baseXScale = this.baseXScale;
        plane.baseYScale = this.baseYScale;
        plane.direction = gameEngine.player.direction.angle;

        for (let x = plane.minx; x <= plane.maxx;x++){

        }



        //this.makeSpans(x, t1, b1, t2, b2, plane);
        // }
    }

    makeSpans(x, t1, b1, t2, b2, plane) {
        while (t1 < t2 && t1 <= b1) {

        }
    }



}