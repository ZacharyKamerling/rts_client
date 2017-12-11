var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Artillery1 = (function (_super) {
    __extends(Artillery1, _super);
    function Artillery1(c, time, frame) {
        if (c) {
            _super.call(this, c, time, frame);
            this.wpn_facing = c.getU8() * 2 * Math.PI / 255;
        }
    }
    Artillery1.prototype.sightRadius = function () {
        return 12;
    };
    Artillery1.prototype.radius = function () {
        return 1.44;
    };
    Artillery1.prototype.step = function (timeDelta, oldUnit, newUnit) {
        _super.prototype.step.call(this, timeDelta, oldUnit, newUnit);
        var f1 = oldUnit.wpn_facing;
        var f2 = newUnit.wpn_facing;
        this.wpn_facing = Misc.turnTowards(this.wpn_facing, f2, Misc.angularDistance(f1, f2) * timeDelta);
    };
    Artillery1.prototype.commands = function (cmds) { };
    Artillery1.prototype.buildables = function (blds) { };
    Artillery1.prototype.render = function (game, layers) {
        var tc = game.teamColors[this.team];
        layers[0].push({ x: this.x, y: this.y, ang: this.facing, ref: "platform1" + tc.name });
        layers[3].push({ x: this.x, y: this.y, ang: this.wpn_facing, ref: "artillery_wpn1" + tc.name });
    };
    Artillery1.prototype.renderMinimap = function (game, layers) {
        var tc = game.teamColors[this.team];
        layers[1].push({ x: this.x, y: this.y, ang: this.facing, ref: "minimap_unit" + tc.name });
    };
    Artillery1.renderBuildPlacement = function () {
        return ["platform1", "artillery_wpn1"];
    };
    return Artillery1;
}(Unit));
