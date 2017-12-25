class BasicMissile extends Missile {
    constructor(c, time, frame, exploding) {
        super(c, time, frame, exploding);
    }
    render(game, layers) {
        let tc = game.teamColors[this.team];
        layers[3].push({ x: this.x, y: this.y, ang: this.facing, ref: "fast_msl1" + tc.name });
    }
    renderExplosion(game, layers) {
    }
    speed() {
        return 24.0;
    }
}
