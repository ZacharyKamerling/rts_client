class Artillery1 extends Unit {
    private wpn_facing: number;

    constructor(c: Cereal, time: number, frame: number) {
        if (c) {
            super(c, time, frame);
            this.wpn_facing = c.getU8() * 2 * Math.PI / 255;
        }
    }

    copycat(unit: Artillery1) {
        super.copycat(unit);
        unit.wpn_facing = this.wpn_facing;
    }

    clone(): Artillery1 {
        var u = new Artillery1(null, this.timeCreated, this.frameCreated);
        this.copycat(u);
        u.wpn_facing = this.wpn_facing;
        return u;
    }

    sightRadius(): number {
        return 12;
    }

    radius(): number {
        return 1.44;
    }

    step(timeDelta: number, oldUnit: Artillery1, newUnit: Artillery1) {
        super.step.call(this, timeDelta, oldUnit, newUnit);
        let f1 = oldUnit.wpn_facing;
        let f2 = newUnit.wpn_facing;
        this.wpn_facing = Misc.turnTowards(this.wpn_facing, f2, Misc.angularDistance(f1, f2) * timeDelta);
    }

    commands(cmds: { [index: string]: void }) { }

    buildables(blds: { [index: string]: void }) { }

    render(game: Game, layers: { x: number, y: number, ang: number, ref: string }[][]): void {
        let tc = game.teamColors[this.team];
        layers[0].push({ x: this.x, y: this.y, ang: this.facing, ref: "platform1" + tc.name });
        layers[3].push({ x: this.x, y: this.y, ang: this.wpn_facing, ref: "artillery_wpn1" + tc.name });
    }

    renderMinimap(game: Game, layers: { x: number, y: number, ang: number, ref: string }[][]): void {
        let tc = game.teamColors[this.team];
        layers[1].push({ x: this.x, y: this.y, ang: this.facing, ref: "minimap_unit" + tc.name });
    }

    static renderBuildPlacement(): string[] {
        return ["platform1", "artillery_wpn1"];
    }
}