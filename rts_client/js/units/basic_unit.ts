class BasicUnit extends Unit {
    private wpn_facing: number;
    private wpn_anim: number;

    constructor(c: Cereal, frame: number) {
        if (c) {
            super(c, frame);
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
        var u = new BasicUnit(null, 0);
        this.copycat(u);
        return u;
    }

    getSightRadius(): number {
        return 12;
    }

    getRadius(): number {
        return 0.6;
    }

    step(time: number, oldUnit: BasicUnit, newUnit: BasicUnit) {
        super.step.call(this, time, oldUnit, newUnit);
        let f1 = oldUnit.wpn_facing;
        let f2 = newUnit.wpn_facing;
        this.wpn_facing = Misc.turnTowards(this.wpn_facing, f2, Misc.angularDistance(f1, f2) * time);
    }

    render(game: Game, layers: { x: number, y: number, ang: number, ref: string }[][]): void {
        /*
        if (this.is_selected) {
            layers[0].push({
                x: this.x, y: this.y, ang: 0.0, ref: "b_select"
            });
        }
        */
        layers[1].push({ x: this.x, y: this.y, ang: this.facing, ref: "basic_unit" });
        layers[2].push({ x: this.x, y: this.y, ang: this.wpn_facing, ref: "basic_wpn"});
    }
}