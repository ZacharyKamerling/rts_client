var MissileType;
(function (MissileType) {
    MissileType[MissileType["Fast1"] = 0] = "Fast1";
    MissileType[MissileType["TestUnit"] = 1] = "TestUnit";
    MissileType[MissileType["TestStructure"] = 2] = "TestStructure";
})(MissileType || (MissileType = {}));
class Misl {
    constructor(c, time, frame, exploding) {
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
    clone() {
        return Object.create(this);
    }
    render(game, layers) {
        throw new Error('Missile: render() is abstract');
    }
    renderExplosion(game, layers) {
        throw new Error('Missile: renderExplosion() is abstract');
    }
    speed() {
        throw new Error('Missile: speed() is abstract');
    }
    step(fps, timeDelta, oldMisl, newMisl) {
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
    static decodeMissile(data, time, frame, exploding) {
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
