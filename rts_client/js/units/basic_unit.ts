class BasicUnit extends Unit {
    private wpn_facing: number;
    private wpn_anim: number;

    constructor(c: Cereal, time: number, frame: number) {
        if (c) {
            super(c, time, frame);
            this.wpn_facing = c.getU8() * 2 * Math.PI / 255;
            this.wpn_anim = c.getU8();
        }
    }

    copycat(unit: BasicUnit) {
        super.copycat(unit);
        unit.wpn_anim = this.wpn_anim;
        unit.wpn_facing = this.wpn_facing;
    }

    clone(): BasicUnit {
        var u = new BasicUnit(null, this.timeCreated, this.frameCreated);
        this.copycat(u);
        u.wpn_anim = this.wpn_anim;
        u.wpn_facing = this.wpn_facing;
        return u;
    }

    sightRadius(): number {
        return 12;
    }

    radius(): number {
        return 0.6;
    }

    step(timeDelta: number, oldUnit: BasicUnit, newUnit: BasicUnit) {
        super.step.call(this, timeDelta, oldUnit, newUnit);
        let f1 = oldUnit.wpn_facing;
        let f2 = newUnit.wpn_facing;
        this.wpn_facing = Misc.turnTowards(this.wpn_facing, f2, Misc.angularDistance(f1, f2) * timeDelta);
    }

    commands(cmds: { [index: string]: void }) {
        cmds['move'] = null;
        cmds['attack'] = null;
        cmds['build'] = null;
    }

    buildables(blds: { [index: string]: void }) {}

    render(game: Game, layers: { x: number, y: number, ang: number, ref: string }[][]): void {
        let tc = game.teamColors[this.team];
        layers[1].push({ x: this.x, y: this.y, ang: this.facing, ref: "basic_unit" + tc.name });
        layers[2].push({ x: this.x, y: this.y, ang: this.wpn_facing, ref: "basic_wpn" + tc.name });
    }
}