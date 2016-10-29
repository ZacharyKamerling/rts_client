class BasicStructure extends Unit {

    constructor(c: Cereal, time: number, frame: number) {
        if (c) {
            super(c, time, frame);
        }
    }

    copycat(unit: BasicStructure) {
        super.copycat(unit);
    }

    clone(): BasicStructure {
        var u = new BasicStructure(null, this.timeCreated, this.frameCreated);
        this.copycat(u);
        return u;
    }

    getSightRadius(): number {
        return 12;
    }

    getRadius(): number {
        return 1.5;
    }

    step(timeDelta: number, oldUnit: BasicStructure, newUnit: BasicStructure) {
        super.step.call(this, timeDelta, oldUnit, newUnit);
    }

    commands(cmds: { [index: string]: void }) {}

    buildables(blds: { [index: string]: void }) {}

    render(game: Game, layers: { x: number, y: number, ang: number, ref: string }[][]): void {
        layers[0].push({ x: this.x, y: this.y, ang: this.facing, ref: "basic_structure" });
    }
}