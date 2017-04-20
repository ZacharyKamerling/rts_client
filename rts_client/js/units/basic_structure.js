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
        }
    }
    BasicStructure.prototype.copycat = function (unit) {
        _super.prototype.copycat.call(this, unit);
    };
    BasicStructure.prototype.clone = function () {
        var u = new BasicStructure(null, this.timeCreated, this.frameCreated);
        this.copycat(u);
        return u;
    };
    BasicStructure.prototype.sightRadius = function () {
        return 12;
    };
    BasicStructure.prototype.radius = function () {
        return 2.0;
    };
    BasicStructure.prototype.step = function (timeDelta, oldUnit, newUnit) {
        _super.prototype.step.call(this, timeDelta, oldUnit, newUnit);
    };
    BasicStructure.prototype.commands = function (cmds) { };
    BasicStructure.prototype.buildables = function (blds) { };
    BasicStructure.prototype.render = function (game, layers) {
        var tc = game.teamColors[this.team];
        layers[0].push({ x: this.x, y: this.y, ang: this.facing, teamColor: tc, ref: "basic_structure" });
    };
    return BasicStructure;
}(Unit));
//# sourceMappingURL=basic_structure.js.map