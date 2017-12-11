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

class Unit {
    spriteGraphic: SpriteGraphic;
    weapons: SpriteGraphic[];
    typeID: number;
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
        this.frameCreated = frame;
        this.timeCreated = time;
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

    static decodeUnit(game: Game, data: Cereal, time: number, frame: number) {
        let typeID = data.getU8();
        let unitID = data.getU16();
        let soul = game.souls[unitID];

        if (soul && soul.current.typeID === typeID) {
            soul.old = soul.current.clone();
            soul.new.decode(data, time, frame);
        }
        else {
            let newUnit = game.unitPrototypes[typeID].clone();
            newUnit.decode(data, time, frame);
            game.souls[unitID] = { new: newUnit, current: newUnit.clone(), old: null };
        }
    }

    render(game: Game, layers: { x: number, y: number, ang: number, ref: string }[][]): void {
        let tc = game.teamColors[this.team];
        let sg = this.spriteGraphic;
        layers[sg.layer].push({ x: this.x, y: this.y, ang: sg.facing, ref: sg.imgRef + tc.name });
        let xy = Misc.rotatePoint(0, 0, this.spriteGraphic.facing);

        for (let wpn of this.weapons) {
            layers[wpn.layer].push({ x: this.x + xy.x, y: this.y + xy.y, ang: wpn.facing, ref: wpn.imgRef + tc.name });
        }
    }

    renderMinimap(game: Game, layers: { x: number, y: number, ang: number, ref: string }[][]): void {
        let tc = game.teamColors[this.team];
        layers[1].push({ x: this.x, y: this.y, ang: this.spriteGraphic.facing, ref: "minimap_unit" + tc.name });
    }

    clone(): Unit {
        return Object.create(this);
    }

    step(timeDelta: number, oldUnit: Unit, newUnit: Unit) {
        let f1 = oldUnit.spriteGraphic.facing;
        let f2 = newUnit.spriteGraphic.facing;
        let turn = Misc.angularDistance(f1, f2) * timeDelta;
        this.spriteGraphic.facing = Misc.turnTowards(this.spriteGraphic.facing, f2, turn);
        this.x = this.x + (newUnit.x - oldUnit.x) * timeDelta;
        this.y = this.y + (newUnit.y - oldUnit.y) * timeDelta;
        this.progress = newUnit.progress;
        this.health = newUnit.health;

        for (let i = 0; i < this.weapons.length; i++) {
            f1 = oldUnit.weapons[i].facing;
            f2 = newUnit.weapons[i].facing;
            this.weapons[i].facing = Misc.turnTowards(this.weapons[i].facing, f2, Misc.angularDistance(f1, f2) * timeDelta);
        }

        if (this.progress >= 255) {
            this.blade_facing += timeDelta * 0.5;

            if (this.blade_facing > Math.PI * 2) {
                this.blade_facing -= Math.PI * 2;
            }
        }
    }
}