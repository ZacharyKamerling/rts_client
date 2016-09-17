class BasicMissile extends Missile{
    constructor(c: Cereal, time:number, frame: number, exploding: boolean) {
        super(c, time, frame, exploding);
    }

    copycat(misl: BasicMissile) {
        super.copycat(misl);
    }

    clone(): BasicMissile {
        var u = new BasicMissile(null, this.timeCreated, this.frameCreated, false);
        this.copycat(u);
        return u;
    }

    render(game: Game, layers: { x: number, y: number, ang: number, ref: string }[][]): void {
        layers[3].push({ x: this.x, y: this.y, ang: this.facing, ref: "basic_missile" });
    }

    renderExplosion(game: Game, layers: { x: number, y: number, ang: number, ref: string }[][]): void {
        
    }

    speed(): number {
        return Game.TILESIZE * 12.0 / 10.0;
    }
}