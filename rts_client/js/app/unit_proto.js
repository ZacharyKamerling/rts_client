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
var Unit = (function () {
    function Unit(str) {
        var o = JSON.parse(str);
        this.spriteGraphic = o.spriteGraphic;
        for (var i = 0; i < o.weapons.length; i++) {
            this.weapons[i] = o.weapons[i].spriteGraphic;
        }
    }
    Unit.prototype.decode = function (c, time, frame) {
        this.frameCreated = frame;
        this.timeCreated = time;
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
    };
    Unit.decodeUnit = function (game, data, time, frame) {
        var typeID = data.getU8();
        var unitID = data.getU16();
        var soul = game.souls[unitID];
        if (soul && soul.current.typeID === typeID) {
            soul.old = soul.current.clone();
            soul.new.decode(data, time, frame);
        }
        else {
            var newUnit = game.unitPrototypes[typeID].clone();
            newUnit.decode(data, time, frame);
            game.souls[unitID] = { new: newUnit, current: newUnit.clone(), old: null };
        }
    };
    Unit.prototype.render = function (game, layers) {
        var tc = game.teamColors[this.team];
        var sg = this.spriteGraphic;
        layers[sg.layer].push({ x: this.x, y: this.y, ang: sg.facing, ref: sg.imgRef + tc.name });
        var xy = Misc.rotatePoint(0, 0, this.spriteGraphic.facing);
        for (var _i = 0, _a = this.weapons; _i < _a.length; _i++) {
            var wpn = _a[_i];
            layers[wpn.layer].push({ x: this.x + xy.x, y: this.y + xy.y, ang: wpn.facing, ref: wpn.imgRef + tc.name });
        }
    };
    Unit.prototype.renderMinimap = function (game, layers) {
        var tc = game.teamColors[this.team];
        layers[1].push({ x: this.x, y: this.y, ang: this.spriteGraphic.facing, ref: "minimap_unit" + tc.name });
    };
    Unit.prototype.clone = function () {
        return Object.create(this);
    };
    Unit.prototype.step = function (timeDelta, oldUnit, newUnit) {
        var f1 = oldUnit.spriteGraphic.facing;
        var f2 = newUnit.spriteGraphic.facing;
        var turn = Misc.angularDistance(f1, f2) * timeDelta;
        this.spriteGraphic.facing = Misc.turnTowards(this.spriteGraphic.facing, f2, turn);
        this.x = this.x + (newUnit.x - oldUnit.x) * timeDelta;
        this.y = this.y + (newUnit.y - oldUnit.y) * timeDelta;
        this.progress = newUnit.progress;
        this.health = newUnit.health;
        for (var i = 0; i < this.weapons.length; i++) {
            f1 = oldUnit.weapons[i].facing;
            f2 = newUnit.weapons[i].facing;
            this.weapons[i].facing = Misc.turnTowards(this.weapons[i].facing, f2, Misc.angularDistance(f1, f2) * timeDelta);
        }
    };
    return Unit;
}());
