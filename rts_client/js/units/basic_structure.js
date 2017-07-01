var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BasicStructure = (function (_super) {
    __extends(BasicStructure, _super);
    function BasicStructure(c, time, frame) {
        if (c) {
            _super.call(this, c, time, frame);
            this.wpn_facing = c.getU8() * 2 * Math.PI / 255;
            this.wpn_anim = c.getU8();
        }
    }
    BasicStructure.prototype.copycat = function (unit) {
        _super.prototype.copycat.call(this, unit);
        unit.wpn_anim = this.wpn_anim;
        unit.wpn_facing = this.wpn_facing;
    };
    BasicStructure.prototype.clone = function () {
        var u = new BasicStructure(null, this.timeCreated, this.frameCreated);
        this.copycat(u);
        u.wpn_anim = this.wpn_anim;
        u.wpn_facing = this.wpn_facing;
        return u;
    };
    BasicStructure.prototype.sightRadius = function () {
        return 12;
    };
    BasicStructure.prototype.radius = function () {
        return 1.44;
    };
    BasicStructure.prototype.step = function (timeDelta, oldUnit, newUnit) {
        _super.prototype.step.call(this, timeDelta, oldUnit, newUnit);
        var f1 = oldUnit.wpn_facing;
        var f2 = newUnit.wpn_facing;
        this.wpn_facing = Misc.turnTowards(this.wpn_facing, f2, Misc.angularDistance(f1, f2) * timeDelta);
    };
    BasicStructure.prototype.commands = function (cmds) { };
    BasicStructure.prototype.buildables = function (blds) { };
    BasicStructure.prototype.render = function (game, layers) {
        var tc = game.teamColors[this.team];
        layers[0].push({ x: this.x, y: this.y, ang: this.facing, ref: "artillery_platform1" + tc.name });
        layers[3].push({ x: this.x, y: this.y, ang: this.wpn_facing, ref: "artillery_wpn1" + tc.name });
    };
    BasicStructure.prototype.render_minimap = function (game, layers) {
        var tc = game.teamColors[this.team];
        layers[1].push({ x: this.x, y: this.y, ang: this.facing, ref: "minimap_unit" + tc.name });
    };
    return BasicStructure;
}(Unit));
