class Extractor1 extends Unit {
    private blade_facing: number;

    constructor(c: Cereal, time: number, frame: number) {
        if (c) {
            super(c, time, frame);
            this.blade_facing = 0;
        }
    }

    sightRadius(): number {
        return 12;
    }

    radius(): number {
        return 1.44;
    }

    step(timeDelta: number, oldUnit: Extractor1, newUnit: Extractor1) {
        super.step.call(this, timeDelta, oldUnit, newUnit);
        if (this.progress >= 255) {
            this.blade_facing += timeDelta * 0.5;

            if (this.blade_facing > Math.PI * 2) {
                this.blade_facing -= Math.PI * 2;
            }
        }
    }

    commands(cmds: { [index: string]: void }) { }

    buildables(blds: { [index: string]: void }) { }

    render(game: Game, layers: { x: number, y: number, ang: number, ref: string }[][]): void {
        let tc = game.teamColors[this.team];
        layers[0].push({ x: this.x, y: this.y, ang: this.facing, ref: "platform2" + tc.name });
        layers[3].push({ x: this.x, y: this.y, ang: this.blade_facing, ref: "extractor_blade1" + tc.name });
    }

    renderMinimap(game: Game, layers: { x: number, y: number, ang: number, ref: string }[][]): void {
        let tc = game.teamColors[this.team];
        layers[1].push({ x: this.x, y: this.y, ang: this.facing, ref: "minimap_unit" + tc.name });
    }

    static renderBuildPlacement(): string[] {
        return ["platform2", "extractor_blade1"];
    }
}