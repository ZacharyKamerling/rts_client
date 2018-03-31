class Missile {
    constructor() {
        this.sprite_graphics = new Array();
    }
    clone() {
        let a = new Missile();
        for (let sg of this.sprite_graphics) {
            a.sprite_graphics.push(sg.clone());
        }
        a.name = this.name;
        a.type_id = this.type_id;
        a.id = this.id;
        a.x = this.x;
        a.y = this.y;
        a.team = this.team;
        a.speed = this.speed;
        a.facing = this.facing;
        a.exploding = this.exploding;
        a.timeCreated = this.timeCreated;
        a.frameCreated = this.frameCreated;
        return a;
    }
    jsonConfig(str) {
        let o = JSON.parse(str);
        if (o.sprite_graphics) {
            for (let i = 0; i < o.sprite_graphics.length; i++) {
                this.sprite_graphics[i] = new SpriteGraphic();
                Object.assign(this.sprite_graphics[i], o.sprite_graphics[i]);
            }
        }
        this.name = o.name;
        this.speed = o.speed;
    }
    decode(c, time, frame, exploding) {
        this.frameCreated = frame;
        this.timeCreated = time;
        this.exploding = exploding;
        this.id = c.getU16();
        this.x = c.getU16() / (64 / Game.TILESIZE);
        this.y = c.getU16() / (64 / Game.TILESIZE);
        this.team = c.getU8();
    }
    render(game, layers) {
        let tc = game.teamColors[this.team];
        let sg = this.sprite_graphics;
        for (let sg of this.sprite_graphics) {
            let ang = Misc.normalizeAngle(this.facing + sg.facing);
            let xy = Misc.rotateAroundOrigin(this.x, this.y, this.x + sg.x_offset, this.y + sg.y_offset, ang);
            layers[sg.layer].push({ x: xy.x, y: xy.y, ang: ang, ref: tc.name + '/' + sg.img_ref });
        }
    }
    step(timeDelta, oldMisl, newMisl) {
        let speed = this.speed * Game.TILESIZE / Game.FPS;
        this.facing = Math.atan2(newMisl.y - oldMisl.y, newMisl.x - oldMisl.x);
        this.x += speed * Math.cos(this.facing) * timeDelta;
        this.y += speed * Math.sin(this.facing) * timeDelta;
        let xDifA = this.x - oldMisl.x;
        let yDifA = this.y - oldMisl.y;
        let xDifB = oldMisl.x - newMisl.x;
        let yDifB = oldMisl.y - newMisl.y;
        let distA = xDifA * xDifA + yDifA * yDifA;
        let distB = xDifB * xDifB + yDifB * yDifB;
        if (newMisl.exploding && distA > distB) {
            this.exploding = true;
        }
    }
    static decodeMissile(game, data, time, frame, exploding) {
        let typeID = data.getU8();
        let new_misl = game.missilePrototypes[typeID].clone();
        new_misl.decode(data, time, frame, exploding);
        if (new_misl) {
            let soul = game.missileSouls[new_misl.id];
            if (soul) {
                soul.old = soul.current.clone();
                soul.old.timeCreated = soul.new.frameCreated;
                soul.new = new_misl;
            }
            else {
                let cur = new_misl.clone();
                game.missileSouls[new_misl.id] = { old: null, current: cur, new: new_misl };
            }
        }
    }
}
