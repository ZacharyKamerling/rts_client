﻿enum UnitType {
    Fast1,
    TestUnit,
    TestStructure,
}

class Unit {
    unit_ID: number;
    anim_ID: number;
    team: number;
    x: number;
    y: number;
    facing: number;
    health: number;
    progress: number;
    frameCreated: number;
    timeCreated: number;
    isDead: boolean;
    isSelected: boolean;
    isBeingSelected: boolean;

    constructor(c: Cereal, time: number, frame: number) {
        if (c) {
            this.frameCreated = frame;
            this.timeCreated = time;
            this.unit_ID = c.getU16();
            this.x = c.getU16() / 64 * Game.TILESIZE;
            this.y = c.getU16() / 64 * Game.TILESIZE;
            this.anim_ID = c.getU8();
            this.team = c.getU8();
            this.facing = c.getU8() * 2 * Math.PI / 255;
            this.health = c.getU8();
            this.progress = c.getU8();
        }
    }

    copycat(unit: Unit) {
        unit.unit_ID = this.unit_ID;
        unit.anim_ID = this.anim_ID;
        unit.team = this.team;
        unit.x = this.x;
        unit.y = this.y;
        unit.facing = this.facing;
        unit.health = this.health;
        unit.progress = this.progress;
        unit.frameCreated = this.frameCreated;
        unit.timeCreated = this.timeCreated;
        unit.isSelected = this.isSelected;
        unit.isBeingSelected = this.isBeingSelected;
    }

    clone(): Unit {
        throw new Error('Unit: clone() is abstract');
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
        throw new Error('Unit: render() is abstract');
    }

    renderDeath(game: Game, layers: { x: number, y: number, ang: number, ref: string }[][]): void {
        throw new Error('Unit: render() is abstract');
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
        this.facing = Misc.turnTowards(this.facing, f2, turn);
        this.x = this.x + (newUnit.x - oldUnit.x) * timeDelta;
        this.y = this.y + (newUnit.y - oldUnit.y) * timeDelta;
        if (newUnit.progress === oldUnit.progress) {
            this.progress = newUnit.progress;
        }
        else {
            this.progress = this.progress + (newUnit.progress - oldUnit.progress) * timeDelta;
        }

        if (newUnit.health === oldUnit.health) {
            this.health = newUnit.health;
        }
        else {
            this.health = this.health + (newUnit.health - oldUnit.health) * timeDelta;
        }
    }

    static decodeUnit(data: Cereal, time: number, frame: number): Unit {
        let unitType = data.getU8();
        switch (unitType) {
            case UnitType.TestUnit:
                return new BasicUnit(data, time, frame);
            case UnitType.TestStructure:
                return new BasicStructure(data, time, frame);
            case UnitType.Fast1:
                return new Fast1(data, time, frame);
            default:
                console.log("No unit of type " + unitType + " exists.");
                return null;
        }
    }
}