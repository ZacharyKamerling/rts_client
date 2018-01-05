class SpriteGraphic {
    facing: number;
    xOffset: number;
    yOffset: number;
    layer: number;
    imgRef: string;
    private rotationRate: number;

    rotate(elapsed: number) {
        if (this.rotationRate) {
            this.facing += this.rotationRate * elapsed;

            while (this.facing > Math.PI * 2) {
                this.facing -= Math.PI * 2;
            }
        }
    }

    clone(): SpriteGraphic {
        let sg = new SpriteGraphic();
        sg.facing = this.facing;
        sg.xOffset = this.xOffset;
        sg.yOffset = this.yOffset;
        sg.layer = this.layer;
        sg.imgRef = this.imgRef;
        sg.rotationRate = this.rotationRate;

        return sg;
    }
}

class Unit {
    spriteGraphics: SpriteGraphic[] = new Array();
    weapons: SpriteGraphic[] = new Array();
    buildRoster: string[] = new Array();
    commandRoster: string[] = new Array();
    passengers: number[] = new Array();
    typeID: number;
    unitID: number;
    animID: number;
    team: number;
    x: number;
    y: number;
    facing: number;
    health: number;
    progress: number;
    radius: number;
    sightRadius: number;

    frameCreated: number;
    timeCreated: number;
    isDead: boolean;
    isSelected: boolean;
    isBeingSelected: boolean;
    capacity: number;

    clone(): Unit {
        let a = new Unit();

        for (let sg of this.spriteGraphics) {
            a.spriteGraphics.push(sg.clone());
        }

        for (let wpn of this.weapons) {
            a.weapons.push(wpn.clone());
        }

        for (let bld of this.buildRoster) {
            a.buildRoster.push(bld);
        }

        for (let cmd of this.commandRoster) {
            a.commandRoster.push(cmd);
        }

        for (let psg of this.passengers) {
            a.passengers.push(psg);
        }

        a.typeID = this.typeID;
        a.unitID = this.unitID;
        a.animID = this.animID;
        a.team = this.team;
        a.x = this.x;
        a.y = this.y;
        a.facing = this.facing;
        a.health = this.health;
        a.progress = this.progress;
        a.radius = this.radius;
        a.sightRadius = this.sightRadius;
        a.frameCreated = this.frameCreated;
        a.timeCreated = this.timeCreated;
        a.isDead = this.isDead;
        a.isSelected = this.isSelected;
        a.isBeingSelected = this.isBeingSelected;
        a.capacity = this.capacity;

        return a;
    }

    jsonConfig(str: string) {
        let o = JSON.parse(str);

        for (let i = 0; i < o.spriteGraphics.length; i++) {
            this.spriteGraphics[i] = new SpriteGraphic();
            Object.assign(this.spriteGraphics[i], o.spriteGraphics[i]);
        }

        for (let i = 0; i < o.weapons.length; i++) {
            this.weapons[i] = new SpriteGraphic();
            Object.assign(this.weapons[i], o.weapons[i].spriteGraphic);
        }

        this.radius = o.collision_radius;
        this.sightRadius = o.sight_range;
    }

    decode(c: Cereal, time: number, frame: number) {
        this.frameCreated = frame;
        this.timeCreated = time;
        this.x = c.getU16() / 64 * Game.TILESIZE;
        this.y = c.getU16() / 64 * Game.TILESIZE;
        this.animID = c.getU8();
        this.team = c.getU8();
        this.facing = c.getU8() * 2 * Math.PI / 255;
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

    render(game: Game, layers: { x: number, y: number, ang: number, ref: string }[][]): void {
        let tc = game.teamColors[this.team];
        let sg = this.spriteGraphics;

        for (let sg of this.spriteGraphics) {
            let ang = Misc.normalizeAngle(this.facing + sg.facing);
            let xy = Misc.rotateAroundOrigin(this.x, this.y, this.x + sg.xOffset, this.y + sg.yOffset, ang);
            layers[sg.layer].push({ x: xy.x, y: xy.y, ang: ang, ref: sg.imgRef + tc.name });
        }

        for (let sg of this.weapons) {
            let xy = Misc.rotateAroundOrigin(this.x, this.y, this.x + sg.xOffset, this.y + sg.yOffset, this.facing);
            layers[sg.layer].push({ x: xy.x, y: xy.y, ang: sg.facing, ref: sg.imgRef + tc.name });
        }
    }

    renderMinimap(game: Game, layers: { x: number, y: number, ang: number, ref: string }[][]): void {
        let tc = game.teamColors[this.team];
        layers[1].push({ x: this.x, y: this.y, ang: this.facing, ref: "minimap_unit" + tc.name });
    }

    step(timeDelta: number, oldUnit: Unit, newUnit: Unit) {
        let f1 = oldUnit.facing;
        let f2 = newUnit.facing;
        let turn = Misc.angularDistance(f1, f2) * timeDelta;
        this.facing = Misc.turnTowards(this.facing, f2, turn);
        this.x = this.x + (newUnit.x - oldUnit.x) * timeDelta;
        this.y = this.y + (newUnit.y - oldUnit.y) * timeDelta;
        this.progress = newUnit.progress;
        this.health = newUnit.health;

        for (let sg of this.spriteGraphics) {
            sg.rotate(timeDelta);
        }

        for (let i = 0; i < this.weapons.length; i++) {
            f1 = oldUnit.weapons[i].facing;
            f2 = newUnit.weapons[i].facing;
            this.weapons[i].facing = Misc.turnTowards(this.weapons[i].facing, f2, Misc.angularDistance(f1, f2) * timeDelta);
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
            newUnit.typeID = typeID;
            game.souls[unitID] = { new: newUnit, current: newUnit.clone(), old: null };
        }
    }
}