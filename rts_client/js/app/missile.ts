class Missile {
    misl_ID: number;
    x: number;
    y: number;
    facing: number;
    exploding: boolean;
    frame_created: number;

    constructor(c: Cereal, frame: number, exploding: boolean) {
        if (c) {
            this.frame_created = frame;
            this.exploding = exploding;
            this.misl_ID = c.getU16();
            this.x = c.getU16() / (64 / Game.TILESIZE);
            this.y = c.getU16() / (64 / Game.TILESIZE);
        }
    }

    clone(): Missile {
        throw new Error('Missile: clone() is abstract');
    }

    copycat(misl: Missile) {
        misl.misl_ID = this.misl_ID;
        misl.x = this.x;
        misl.y = this.y;
        misl.exploding = this.exploding;
        misl.frame_created = this.frame_created;
    }

    render(game: Game, layers: { x: number, y: number, ang: number, ref: string }[][]): void {
        throw new Error('Missile: render() is abstract');
    }

    renderExplosion(game: Game, layers: { x: number, y: number, ang: number, ref: string }[][]): void {
        throw new Error('Missile: renderExplosion() is abstract');
    }

    speed(): number {
        throw new Error('Missile: speed() is abstract');
    }

    step(time: number, oldMisl: Missile, newMisl: Missile) {
        this.facing = Math.atan2(newMisl.y - this.y, newMisl.x - this.x);
        this.x += this.speed() * Math.cos(this.facing) * time;
        this.y += this.speed() * Math.sin(this.facing) * time;
        let xDifA = this.x - oldMisl.x;
        let yDifA = this.y - oldMisl.y;
        let xDifB = oldMisl.x - newMisl.x;
        let yDifB = oldMisl.y - newMisl.y;
        let distA = xDifA * xDifA + yDifA * yDifA;
        let distB = xDifB * xDifB + yDifB * yDifB;

        if (newMisl.exploding && distA > distB) {
            this.exploding = true;
        }
    }

    static decodeMissile(data: Cereal, frame: number, exploding: boolean): Missile {
        let mislType = data.getU8();
        switch (mislType) {
            case 0:
                return new BasicMissile(data, frame, exploding);
            default:
                console.log("No missile of type " + mislType + " exists.");
                return null;
        }
    }
}