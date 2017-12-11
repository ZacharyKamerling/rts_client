class SpriteGraphic {
    facing: number;
    xOffset: number;
    yOffset: number;
    layer: number;
    imgRef: string;
    private cycleRate: number;
    private cycleCurrent: number;

    cycle(elapsed: number) {
        this.cycleCurrent += this.cycleRate * elapsed;

        while (this.cycleCurrent > 1) {
            this.cycleCurrent -= 1;
        }
    }

    currentCycle(): number {
        return this.cycleCurrent;
    }
}

class UnitProto {
    spriteGraphic: SpriteGraphic;
    weapons: SpriteGraphic[];
    unitID: number;
    animID: number;
    team: number;
    x: number;
    y: number;
    health: number;
    progress: number;
    frameCreated: number;
    timeCreated: number;
    isDead: boolean;
    isSelected: boolean;
    isBeingSelected: boolean;
    capacity: number;
    passengers: number[];

    constructor(str: string) {
        let o = JSON.parse(str);
        this.spriteGraphic = o.spriteGraphic;

        for (let i = 0; i < o.weapons.length; i++) {
            this.weapons[i] = o.weapons[i].spriteGraphic;
        }
    }

    decode(c: Cereal, time: number, frame: number) {
        if (c) {
            this.frameCreated = frame;
            this.timeCreated = time;
            this.unitID = c.getU16();
            this.x = c.getU16() / 64 * Game.TILESIZE;
            this.y = c.getU16() / 64 * Game.TILESIZE;
            this.animID = c.getU8();
            this.team = c.getU8();
            this.spriteGraphic.facing = c.getU8() * 2 * Math.PI / 255;
            this.health = c.getU8();
            this.progress = c.getU8();

            for (let wpn of this.weapons) {
                wpn.facing = c.getU8() * 2 * Math.PI / 255;
            }

            if (this.capacity > 0) {
                this.passengers = new Array();
                let passengerCount = c.getU8();

                for (;passengerCount > 0; passengerCount--) {
                    this.passengers.push(c.getU16());
                }
            }
        }
    }

    clone(): Unit {
        return Object.create(this);
    }

    sightRadius(): number {
        throw new Error('Unit: getSightRadius() is abstract');
    }

    radius(): number {
        throw new Error('Unit: getRadius() is abstract');
    }

    widthAndHeight(): { w: number, h: number } {
        throw new Error('Unit: widthAndHeight() is abstract');
    }

    render(game: Game, layers: { x: number, y: number, ang: number, ref: string }[][]): void {
        throw new Error('Unit: render() is abstract');
    }

    renderMinimap(game: Game, layers: { x: number, y: number, ref: string }[][]): void {
        throw new Error('Unit: renderMinimap() is abstract');
    }

    renderDeath(game: Game, layers: { x: number, y: number, ang: number, ref: string }[][]): void {
        throw new Error('Unit: renderDeath() is abstract');
    }

    commands(cmds: { [index: string]: void }) {
        throw new Error('Unit: commands() is abstract');
    }

    buildables(blds: { [index: string]: void }) {
        throw new Error('Unit: buildables() is abstract');
    }

    step(timeDelta: number, oldUnit: Unit, newUnit: Unit) {
        let f1 = oldUnit.facing;
        let f2 = newUnit.facing;
        let turn = Misc.angularDistance(f1, f2) * timeDelta;
        this.spriteGraphic.facing = Misc.turnTowards(this.spriteGraphic.facing, f2, turn);
        this.x = this.x + (newUnit.x - oldUnit.x) * timeDelta;
        this.y = this.y + (newUnit.y - oldUnit.y) * timeDelta;
        this.progress = newUnit.progress;
        this.health = newUnit.health;
    }

    static decodeUnit(data: Cereal, time: number, frame: number): Unit {
        let unitType = data.getU8();
        switch (unitType) {
            case UnitType.Medium1:
                return new Medium1(data, time, frame);
            case UnitType.Artillery1:
                return new Artillery1(data, time, frame);
            case UnitType.Fast1:
                return new Fast1(data, time, frame);
            case UnitType.Extractor1:
                return new Extractor1(data, time, frame);
            default:
                console.log("No unit of type " + unitType + " exists.");
                return null;
        }
    }
}