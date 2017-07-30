var MissileType;
(function (MissileType) {
    MissileType[MissileType["Fast1"] = 0] = "Fast1";
    MissileType[MissileType["TestUnit"] = 1] = "TestUnit";
    MissileType[MissileType["TestStructure"] = 2] = "TestStructure";
})(MissileType || (MissileType = {}));
var Missile = (function () {
    function Missile(c, time, frame, exploding) {
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
    Missile.prototype.clone = function () {
        throw new Error('Missile: clone() is abstract');
    };
    Missile.prototype.copycat = function (misl) {
        misl.misl_ID = this.misl_ID;
        misl.x = this.x;
        misl.y = this.y;
        misl.team = this.team;
        misl.exploding = this.exploding;
        misl.frameCreated = this.frameCreated;
        misl.timeCreated = this.timeCreated;
    };
    Missile.prototype.render = function (game, layers) {
        throw new Error('Missile: render() is abstract');
    };
    Missile.prototype.renderExplosion = function (game, layers) {
        throw new Error('Missile: renderExplosion() is abstract');
    };
    Missile.prototype.speed = function () {
        throw new Error('Missile: speed() is abstract');
    };
    Missile.prototype.step = function (fps, timeDelta, oldMisl, newMisl) {
        var speed = this.speed() * Game.TILESIZE / Game.FPS;
        this.facing = Math.atan2(newMisl.y - oldMisl.y, newMisl.x - oldMisl.x);
        this.x += speed * Math.cos(this.facing) * timeDelta;
        this.y += speed * Math.sin(this.facing) * timeDelta;
        var xDifA = this.x - oldMisl.x;
        var yDifA = this.y - oldMisl.y;
        var xDifB = oldMisl.x - newMisl.x;
        var yDifB = oldMisl.y - newMisl.y;
        var distA = xDifA * xDifA + yDifA * yDifA;
        var distB = xDifB * xDifB + yDifB * yDifB;
        if (newMisl.exploding && distA > distB) {
            this.exploding = true;
        }
    };
    Missile.decodeMissile = function (data, time, frame, exploding) {
        var mislType = data.getU8();
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
    };
    return Missile;
}());
