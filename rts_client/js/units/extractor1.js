var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Extractor1 = (function (_super) {
    __extends(Extractor1, _super);
    function Extractor1(c, time, frame) {
        if (c) {
            _super.call(this, c, time, frame);
            this.blade_facing = 0;
        }
    }
    Extractor1.prototype.copycat = function (unit) {
        _super.prototype.copycat.call(this, unit);
        unit.blade_facing = this.blade_facing;
    };
    Extractor1.prototype.clone = function () {
        var u = new Extractor1(null, this.timeCreated, this.frameCreated);
        this.copycat(u);
        u.blade_facing = this.blade_facing;
        return u;
    };
    Extractor1.prototype.sightRadius = function () {
        return 12;
    };
    Extractor1.prototype.radius = function () {
        return 1.44;
    };
    Extractor1.prototype.step = function (timeDelta, oldUnit, newUnit) {
        _super.prototype.step.call(this, timeDelta, oldUnit, newUnit);
        if (this.progress >= 255) {
            this.blade_facing += timeDelta * 0.5;
        }
    };
    Extractor1.prototype.commands = function (cmds) { };
    Extractor1.prototype.buildables = function (blds) { };
    Extractor1.prototype.render = function (game, layers) {
        var tc = game.teamColors[this.team];
        layers[0].push({ x: this.x, y: this.y, ang: this.facing, ref: "platform2" + tc.name });
        layers[3].push({ x: this.x, y: this.y, ang: this.blade_facing, ref: "extractor_blade1" + tc.name });
    };
    Extractor1.prototype.renderMinimap = function (game, layers) {
        var tc = game.teamColors[this.team];
        layers[1].push({ x: this.x, y: this.y, ang: this.facing, ref: "minimap_unit" + tc.name });
    };
    Extractor1.renderBuildPlacement = function () {
        return ["platform2", "extractor_blade1"];
    };
    return Extractor1;
}(Unit));
