var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Fast1 = (function (_super) {
    __extends(Fast1, _super);
    function Fast1(c, time, frame) {
        if (c) {
            _super.call(this, c, time, frame);
            this.wpn_facing = c.getU8() * 2 * Math.PI / 255;
            this.wpn_anim = c.getU8();
        }
    }
    Fast1.prototype.copycat = function (unit) {
        _super.prototype.copycat.call(this, unit);
        unit.wpn_anim = this.wpn_anim;
        unit.wpn_facing = this.wpn_facing;
    };
    Fast1.prototype.clone = function () {
        var u = new Fast1(null, this.timeCreated, this.frameCreated);
        this.copycat(u);
        u.wpn_anim = this.wpn_anim;
        u.wpn_facing = this.wpn_facing;
        return u;
    };
    Fast1.prototype.sightRadius = function () {
        return 16;
    };
    Fast1.prototype.radius = function () {
        return 0.96;
    };
    Fast1.prototype.step = function (timeDelta, oldUnit, newUnit) {
        _super.prototype.step.call(this, timeDelta, oldUnit, newUnit);
        var f1 = oldUnit.wpn_facing;
        var f2 = newUnit.wpn_facing;
        this.wpn_facing = Misc.turnTowards(this.wpn_facing, f2, Misc.angularDistance(f1, f2) * timeDelta);
    };
    Fast1.prototype.commands = function (cmds) {
        cmds['move'] = null;
        cmds['attack'] = null;
        cmds['build'] = null;
    };
    Fast1.prototype.buildables = function (blds) { };
    Fast1.prototype.render = function (game, layers) {
        var tc = game.teamColors[this.team];
        layers[1].push({ x: this.x, y: this.y, ang: this.facing, ref: "fast1" + tc.name });
        var xy = Misc.rotatePoint(-2, 0, this.facing);
        layers[2].push({ x: this.x + xy.x, y: this.y + xy.y, ang: this.wpn_facing, ref: "fast_wpn1" + tc.name });
    };
    Fast1.prototype.renderMinimap = function (game, layers) {
        var tc = game.teamColors[this.team];
        layers[1].push({ x: this.x, y: this.y, ref: "minimap_unit" + tc.name });
    };
    return Fast1;
}(Unit));
