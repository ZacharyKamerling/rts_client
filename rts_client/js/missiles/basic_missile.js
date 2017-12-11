var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BasicMissile = (function (_super) {
    __extends(BasicMissile, _super);
    function BasicMissile(c, time, frame, exploding) {
        _super.call(this, c, time, frame, exploding);
    }
    BasicMissile.prototype.render = function (game, layers) {
        var tc = game.teamColors[this.team];
        layers[3].push({ x: this.x, y: this.y, ang: this.facing, ref: "fast_msl1" + tc.name });
    };
    BasicMissile.prototype.renderExplosion = function (game, layers) {
    };
    BasicMissile.prototype.speed = function () {
        return 24.0;
    };
    return BasicMissile;
}(Missile));
