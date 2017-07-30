var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BasicUnit = (function (_super) {
    __extends(BasicUnit, _super);
    function BasicUnit(c, time, frame) {
        if (c) {
            _super.call(this, c, time, frame);
            this.wpn_facing = c.getU8() * 2 * Math.PI / 255;
        }
    }
    BasicUnit.prototype.copycat = function (unit) {
        _super.prototype.copycat.call(this, unit);
        unit.wpn_facing = this.wpn_facing;
    };
    BasicUnit.prototype.clone = function () {
        var u = new BasicUnit(null, this.timeCreated, this.frameCreated);
        this.copycat(u);
        u.wpn_facing = this.wpn_facing;
        return u;
    };
    BasicUnit.prototype.sightRadius = function () {
        return 16;
    };
    BasicUnit.prototype.radius = function () {
        return 0.96;
    };
    BasicUnit.prototype.step = function (timeDelta, oldUnit, newUnit) {
        _super.prototype.step.call(this, timeDelta, oldUnit, newUnit);
        var f1 = oldUnit.wpn_facing;
        var f2 = newUnit.wpn_facing;
        this.wpn_facing = Misc.turnTowards(this.wpn_facing, f2, Misc.angularDistance(f1, f2) * timeDelta);
    };
    BasicUnit.prototype.commands = function (cmds) {
        cmds['move'] = null;
        cmds['attack'] = null;
        cmds['build'] = null;
    };
    BasicUnit.prototype.buildables = function (blds) { };
    BasicUnit.prototype.render = function (game, layers) {
        var tc = game.teamColors[this.team];
        layers[1].push({ x: this.x, y: this.y, ang: this.facing, ref: "basic_unit" + tc.name });
        var xy = Misc.rotatePoint(0, 0, this.facing);
        layers[2].push({ x: this.x + xy.x, y: this.y + xy.y, ang: this.wpn_facing, ref: "basic_wpn" + tc.name });
    };
    BasicUnit.prototype.renderMinimap = function (game, layers) {
        var tc = game.teamColors[this.team];
        layers[1].push({ x: this.x, y: this.y, ref: "minimap_unit" + tc.name });
    };
    return BasicUnit;
}(Unit));
