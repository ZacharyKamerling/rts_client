var SpriteGraphic = (function () {
    function SpriteGraphic() {
    }
    SpriteGraphic.prototype.cycle = function (elapsed) {
        this.cycleCurrent += this.cycleRate * elapsed;
        while (this.cycleCurrent > 1) {
            this.cycleCurrent -= 1;
        }
    };
    SpriteGraphic.prototype.currentCycle = function () {
        return this.cycleCurrent;
    };
    return SpriteGraphic;
}());
var UnitProto = (function () {
    function UnitProto(str) {
        var o = JSON.parse(str);
        this.spriteGraphic = o.spriteGraphic;
        for (var i = 0; i < o.weapons.length; i++) {
            this.weapons[i] = o.weapons[i].spriteGraphic;
        }
    }
    UnitProto.prototype.decode = function (c, time, frame) {
        if (c) {
            this.frameCreated = frame;
            this.timeCreated = time;
            this.unitID = c.getU16();
            this.x = c.getU16() / 64 * Game.TILESIZE;
            this.y = c.getU16() / 64 * Game.TILESIZE;
            this.animID = c.getU8();
            this.team = c.getU8();
            this.spriteGraphic.facing = c.getU8() * 2 * Math.PI / 255;
            this.health = c.getU8();
            this.progress = c.getU8();
            for (var _i = 0, _a = this.weapons; _i < _a.length; _i++) {
                var wpn = _a[_i];
                wpn.facing = c.getU8() * 2 * Math.PI / 255;
            }
            if (this.capacity > 0) {
                this.passengers = new Array();
                var passengerCount = c.getU8();
                for (; passengerCount > 0; passengerCount--) {
                    this.passengers.push(c.getU16());
                }
            }
        }
    };
    UnitProto.prototype.clone = function () {
        return Object.create(this);
    };
    UnitProto.prototype.sightRadius = function () {
        throw new Error('Unit: getSightRadius() is abstract');
    };
    UnitProto.prototype.radius = function () {
        throw new Error('Unit: getRadius() is abstract');
    };
    UnitProto.prototype.widthAndHeight = function () {
        throw new Error('Unit: widthAndHeight() is abstract');
    };
    UnitProto.prototype.render = function (game, layers) {
        throw new Error('Unit: render() is abstract');
    };
    UnitProto.prototype.renderMinimap = function (game, layers) {
        throw new Error('Unit: renderMinimap() is abstract');
    };
    UnitProto.prototype.renderDeath = function (game, layers) {
        throw new Error('Unit: renderDeath() is abstract');
    };
    UnitProto.prototype.commands = function (cmds) {
        throw new Error('Unit: commands() is abstract');
    };
    UnitProto.prototype.buildables = function (blds) {
        throw new Error('Unit: buildables() is abstract');
    };
    UnitProto.prototype.step = function (timeDelta, oldUnit, newUnit) {
        var f1 = oldUnit.facing;
        var f2 = newUnit.facing;
        var turn = Misc.angularDistance(f1, f2) * timeDelta;
        this.spriteGraphic.facing = Misc.turnTowards(this.spriteGraphic.facing, f2, turn);
        this.x = this.x + (newUnit.x - oldUnit.x) * timeDelta;
        this.y = this.y + (newUnit.y - oldUnit.y) * timeDelta;
        this.progress = newUnit.progress;
        this.health = newUnit.health;
    };
    UnitProto.decodeUnit = function (data, time, frame) {
        var unitType = data.getU8();
        switch (unitType) {
            case UnitType.Medium1:
                return new Medium1(data, time, frame);
            case UnitType.Artillery1:
                return new Artillery1(data, time, frame);
            case UnitType.Fast1:
                return new Fast1(data, time, frame);
            case UnitType.Extractor1:
                return new Extractor1(data, time, frame);
            default:
                console.log("No unit of type " + unitType + " exists.");
                return null;
        }
    };
    return UnitProto;
}());
