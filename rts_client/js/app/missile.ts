enum MissileType {
    Fast1,
    TestUnit,
    TestStructure,
}

class Missile {
    misl_ID: number;
    x: number;
    y: number;
    team: number;
    facing: number;
    exploding: boolean;
    timeCreated: number;
    frameCreated: number;

    constructor(c: Cereal, time: number, frame: number, exploding: boolean) {
        if (c) {
            this.frameCreated = frame;
            this.timeCreated = time;
            this.exploding = exploding;
            this.misl_ID = c.getU16();
            this.x = c.getU16() / (64 / Game.TILESIZE);
            this.y = c.getU16() / (64 / Game.TILESIZE);
            this.team = c.getU8();
        }
    }

    clone(): Missile {
        return Object.create(this);
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

    step(fps: number, timeDelta: number, oldMisl: Missile, newMisl: Missile) {
        let speed = this.speed() * Game.TILESIZE / Game.FPS;
        this.facing = Math.atan2(newMisl.y - oldMisl.y, newMisl.x - oldMisl.x);
        this.x += speed * Math.cos(this.facing) * timeDelta;
        this.y += speed * Math.sin(this.facing) * timeDelta;
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

    static decodeMissile(data: Cereal, time: number, frame: number, exploding: boolean): Missile {
        let mislType = data.getU8();
        switch (mislType) {
            case MissileType.TestUnit:
                return new BasicMissile(data, time, frame, exploding);
            case MissileType.TestStructure:
                return new BasicMissile(data, time, frame, exploding);
            case MissileType.Fast1:
                return new BasicMissile(data, time, frame, exploding);
            default:
                console.log("No missile of type " + mislType + " exists.");
                return null;
        }
    }
}