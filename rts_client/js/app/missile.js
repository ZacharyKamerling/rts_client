var Missile = (function () {
    function Missile(c, frame, exploding) {
        if (c) {
            this.frame_created = frame;
            this.exploding = exploding;
            this.misl_ID = c.getU16();
            this.x = c.getU16() / (64 / Game.TILESIZE);
            this.y = c.getU16() / (64 / Game.TILESIZE);
        }
    }
    Missile.prototype.clone = function () {
        throw new Error('Missile: clone() is abstract');
    };
    Missile.prototype.copycat = function (misl) {
        misl.misl_ID = this.misl_ID;
        misl.x = this.x;
        misl.y = this.y;
        misl.exploding = this.exploding;
        misl.frame_created = this.frame_created;
    };
    Missile.prototype.render = function (game, layers) {
        throw new Error('Missile: render() is abstract');
    };
    Missile.prototype.speed = function () {
        throw new Error('Missile: speed() is abstract');
    };
    Missile.prototype.step = function (time, oldMisl, newMisl) {
        this.facing = Math.atan2(newMisl.y - this.y, newMisl.x - this.x);
        this.x += this.speed() * Math.cos(this.facing) * time;
        this.y += this.speed() * Math.sin(this.facing) * time;
    };
    Missile.decodeMissile = function (data, frame, exploding) {
        var mislType = data.getU8();
        switch (mislType) {
            case 0:
                return new BasicMissile(data, frame, exploding);
            default:
                console.log("No missile of type " + mislType + " exists.");
                return null;
        }
    };
    return Missile;
})();
//# sourceMappingURL=missile.js.map