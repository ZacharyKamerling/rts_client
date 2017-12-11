var UnitType;
(function (UnitType) {
    UnitType[UnitType["Artillery1"] = 0] = "Artillery1";
    UnitType[UnitType["Medium1"] = 1] = "Medium1";
    UnitType[UnitType["Extractor1"] = 2] = "Extractor1";
    UnitType[UnitType["Fast1"] = 3] = "Fast1";
})(UnitType || (UnitType = {}));
var Unit = (function () {
    function Unit(c, time, frame) {
        if (c) {
            this.frameCreated = frame;
            this.timeCreated = time;
            this.unit_ID = c.getU16();
            this.x = c.getU16() / 64 * Game.TILESIZE;
            this.y = c.getU16() / 64 * Game.TILESIZE;
            this.anim_ID = c.getU8();
            this.team = c.getU8();
            this.facing = c.getU8() * 2 * Math.PI / 255;
            this.health = c.getU8();
            this.progress = c.getU8();
        }
    }
    Unit.prototype.clone = function () {
        return Object.create(this);
    };
    Unit.prototype.sightRadius = function () {
        throw new Error('Unit: getSightRadius() is abstract');
    };
    Unit.prototype.radius = function () {
        throw new Error('Unit: getRadius() is abstract');
    };
    Unit.prototype.widthAndHeight = function () {
        throw new Error('Unit: widthAndHeight() is abstract');
    };
    Unit.prototype.render = function (game, layers) {
        throw new Error('Unit: render() is abstract');
    };
    Unit.prototype.renderMinimap = function (game, layers) {
        throw new Error('Unit: renderMinimap() is abstract');
    };
    Unit.prototype.renderDeath = function (game, layers) {
        throw new Error('Unit: renderDeath() is abstract');
    };
    Unit.prototype.commands = function (cmds) {
        throw new Error('Unit: commands() is abstract');
    };
    Unit.prototype.buildables = function (blds) {
        throw new Error('Unit: buildables() is abstract');
    };
    Unit.prototype.step = function (timeDelta, oldUnit, newUnit) {
        var f1 = oldUnit.facing;
        var f2 = newUnit.facing;
        var turn = Misc.angularDistance(f1, f2) * timeDelta;
        this.facing = Misc.turnTowards(this.facing, f2, turn);
        this.x = this.x + (newUnit.x - oldUnit.x) * timeDelta;
        this.y = this.y + (newUnit.y - oldUnit.y) * timeDelta;
        this.progress = newUnit.progress;
        this.health = newUnit.health;
    };
    Unit.decodeUnit = function (data, time, frame) {
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
    return Unit;
}());
