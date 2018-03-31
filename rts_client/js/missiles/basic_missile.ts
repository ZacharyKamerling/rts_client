class BasicMissile extends Missile{
    constructor(c: Cereal, time:number, frame: number, exploding: boolean) {
        super(c, time, frame, exploding);
    }

    render(game: Game, layers: { x: number, y: number, ang: number, ref: string }[][]): void {
        let tc = game.teamColors[this.team];
        layers[3].push({ x: this.x, y: this.y, ang: this.facing, ref: tc.name + '/' + "img/fast_msl1.png" });
    }

    renderExplosion(game: Game, layers: { x: number, y: number, ang: number, ref: string }[][]): void {
        
    }

    speed(): number {
        return 24.0;
    }
}