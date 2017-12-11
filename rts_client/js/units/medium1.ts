class Medium1 extends Unit {
    private wpn_facing: number;

    constructor(c: Cereal, time: number, frame: number) {
        if (c) {
            super(c, time, frame);
            this.wpn_facing = c.getU8() * 2 * Math.PI / 255;
        }
    }

    sightRadius(): number {
        return 16;
    }

    radius(): number {
        return 0.96;
    }

    step(timeDelta: number, oldUnit: Medium1, newUnit: Medium1) {
        super.step.call(this, timeDelta, oldUnit, newUnit);
        let f1 = oldUnit.wpn_facing;
        let f2 = newUnit.wpn_facing;
        this.wpn_facing = Misc.turnTowards(this.wpn_facing, f2, Misc.angularDistance(f1, f2) * timeDelta);
    }

    commands(cmds: { [index: string]: void }) {
        cmds['move'] = null;
        cmds['attack'] = null;
        cmds['buildArtillery1'] = null;
        cmds['buildExtractor1'] = null;
    }

    buildables(blds: { [index: string]: void }) {}

    render(game: Game, layers: { x: number, y: number, ang: number, ref: string }[][]): void {
        let tc = game.teamColors[this.team];
        layers[1].push({ x: this.x, y: this.y, ang: this.facing, ref: "basic_unit" + tc.name });
        let xy = Misc.rotatePoint(0, 0, this.facing);
        layers[2].push({ x: this.x + xy.x, y: this.y + xy.y, ang: this.wpn_facing, ref: "basic_wpn" + tc.name });
    }

    renderMinimap(game: Game, layers: { x: number, y: number, ref: string }[][]): void {
        let tc = game.teamColors[this.team];
        layers[1].push({ x: this.x, y: this.y, ref: "minimap_unit" + tc.name });
    }
}