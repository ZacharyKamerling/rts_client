var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BasicMissile = (function (_super) {
    __extends(BasicMissile, _super);
    function BasicMissile(c, frame, exploding) {
        _super.call(this, c, frame, exploding);
    }
    BasicMissile.prototype.copycat = function (misl) {
        _super.prototype.copycat.call(this, misl);
    };
    BasicMissile.prototype.clone = function () {
        var u = new BasicMissile(null, 0, false);
        this.copycat(u);
        return u;
    };
    BasicMissile.prototype.render = function (game, layers) {
        layers[3].push({ x: this.x, y: this.y, ang: this.facing, ref: "basic_missile" });
    };
    /*
    renderExplosion(game: Game, layers: { x: number, y: number, ang: number, ref: string }[][]): void {
        
    }
    */
    BasicMissile.prototype.speed = function () {
        return Game.TILESIZE * 12.0 / 10.0;
    };
    return BasicMissile;
})(Missile);
//# sourceMappingURL=basic_missile.js.map