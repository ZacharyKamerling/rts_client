﻿"use strict";
class Game {
    private static MAX_UNITS = 4096;
    public static TILESIZE = 32;
    public connected: boolean = true;
    private chef: Chef = null;
    private tileDrawer: TileDrawer = null;
    private unitDrawer: UnitDrawer = null;
    private fowDrawer: FOWDrawer = null;
    private commandPanel: CommandPanel = null;
    private selectionDrawer: SelectionDrawer = null;
    private selectionBoxDrawer: SelectionBoxDrawer = null;
    private control: Control = new DoingNothing();
    private camera: Camera = new Camera(0, 0);
    private connection: WebSocket = null;
    private souls: { old: Unit, current: Unit, new: Unit }[] = null;
    private missileSouls: { old: Missile, current: Missile, new: Missile }[] = null;
    private logicFrame: number = 0;
    private lastDrawTime: number = 0;
    private lastLogicFrameTime: number = 0;
    private team: number = 0;
    private metal: number = 0;
    private energy: number = 0;
    private fps = 10;

    constructor() {
        this.souls = Array();

        for (let i = 0; i < Game.MAX_UNITS; i++) {
            this.souls.push(null);
        }

        this.missileSouls = Array();

        for (let i = 0; i < Game.MAX_UNITS * 4; i++) {
            this.missileSouls.push(null);
        }
    }

    public reset() {

        for (let i = 0; i < Game.MAX_UNITS; i++) {
            this.souls[i] = null;
        }

        for (let i = 0; i < Game.MAX_UNITS * 4; i++) {
            this.missileSouls[i] = null;
        }
    }

    public setChef(chef: Chef) {
        this.chef = chef;
    }

    public setConnection(conn: WebSocket) {
        this.connection = conn;
    }

    public setTileDrawer(td: TileDrawer) {
        this.tileDrawer = td;
    }

    public setUnitDrawer(ud: UnitDrawer) {
        this.unitDrawer = ud;
    }

    public setFOWDrawer(fd: FOWDrawer) {
        this.fowDrawer = fd;
    }

    public setSelectionDrawer(sd: SelectionDrawer) {
        this.selectionDrawer = sd;
    }

    public setSelectionBoxDrawer(sbd: SelectionBoxDrawer) {
        this.selectionBoxDrawer = sbd;
    }

    public setCommandPanel(cp: CommandPanel) {
        this.commandPanel = cp;
    }

    public commandPanelHandler(): (name: string) => void {
        let game = this;
        return function (name: string) {
            switch (name) {
                case "move":
                    game.control = new IssuingMove();
                    break;
                case "attack":
                    game.control = new IssuingAttackMove();
                    break;
                default:
                    game.control = new DoingNothing();
                    break;
            }
        };
    }

    public processPacket(data: Cereal): void {
        let currentTime = Date.now();
        let logicFrame = data.getU32();

        if (logicFrame > this.logicFrame) {
            this.logicFrame = logicFrame;
            this.lastLogicFrameTime = currentTime;

            for (let i = 0; i < this.souls.length; i++) {
                let soul = this.souls[i];
                if (soul && (logicFrame - soul.new.frameCreated > 2)) {
                    this.souls[i] = null;
                }
            }

            for (let i = 0; i < this.missileSouls.length; i++) {
                let misl_soul = this.missileSouls[i];
                if (misl_soul && (logicFrame - misl_soul.new.frameCreated > 2)) {
                    this.missileSouls[i] = null;
                }
            }
        }
        else if (logicFrame < this.logicFrame) {
            return;
        }

        while (!data.empty()) {
            let msg_type = data.getU8();

            msg_switch:
            switch (msg_type) {
                // Unit
                case 0:
                    let new_unit: Unit = Unit.decodeUnit(data, currentTime, logicFrame);

                    // If unit_soul exists, update it with new_unit
                    if (new_unit) {
                        let soul = this.souls[new_unit.unit_ID];

                        if (soul) {
                            soul.old = soul.current.clone();
                            soul.old.timeCreated = soul.new.timeCreated;
                            soul.new = new_unit;
                        }
                        else {
                            var cur = new_unit.clone();
                            this.souls[new_unit.unit_ID] = { old: null, current: cur, new: new_unit };
                        }
                    }
                    break msg_switch;
                // Missile
                case 1:
                case 2:
                    let exploding = msg_type === 2;
                    let new_misl: Missile = Missile.decodeMissile(data, currentTime, logicFrame, exploding);

                    if (new_misl) {
                        let soul = this.missileSouls[new_misl.misl_ID];

                        if (soul) {
                            soul.old = soul.current.clone();
                            soul.new = new_misl;
                        }
                        else {
                            let cur = new_misl.clone();
                            this.missileSouls[new_misl.misl_ID] = { old: null, current: cur, new: new_misl };
                        }
                    }
                    break msg_switch;
                // Unit death
                case 3:
                    let unit_ID = data.getU16();
                    let dmg_type = data.getU8();
                    this.souls[unit_ID] = null;
                    break msg_switch;
                // Player Info
                case 4:
                    this.team = data.getU8();
                    this.metal = data.getU32();
                    this.energy = data.getU32();
                    break msg_switch;
                default:
                    console.log("No message of type " + msg_type + " exists.");
                    return;
            }
        }
    }

    public interact(): ((parent: HTMLElement, e: InputEvent) => void) {
        let game = this;

        return function (parent, event) {
            let control = game.control;

            if (control instanceof DoingNothing) {
                if (event instanceof MousePress) {
                    // Move Camera initiate
                    if (event.btn === MouseButton.Middle && event.down) {
                        game.control = new MovingCamera(event.x, event.y, game.camera.x, game.camera.y);
                    }
                    // Select things initiate
                    else if (event.btn === MouseButton.Left && event.down) {
                        let x = game.camera.x + event.x - parent.offsetWidth / 2;
                        let y = game.camera.y - (event.y - parent.offsetHeight / 2);
                        game.control = new SelectingUnits(x, y, x, y, event.shiftDown);

                        if (!event.shiftDown) {
                            for (let i = 0; i < game.souls.length; i++) {
                                let soul = game.souls[i];

                                if (soul) {
                                    soul.current.isSelected = false;
                                }
                            }
                        }
                    }
                    // Issue move order
                    else if (event.btn === MouseButton.Right && event.down) {
                        game.issueMoveOrder(parent, event);
                    }
                }
                else if (event instanceof KeyPress) {
                    const A = 65;
                    const M = 77;

                    if (event.down) {
                        if (event.key === A) {
                            game.control = new IssuingAttackMove();
                        }
                        else if (event.key === M) {
                            game.control = new IssuingMove();
                        }
                    }
                }
            }
            else if (control instanceof MovingCamera) {
                // Stop moving camera
                if (event instanceof MousePress) {
                    if (event.btn === MouseButton.Middle && !event.down) {
                        game.control = new DoingNothing();
                    }
                }
                // Move camera
                else if (event instanceof MouseMove) {
                    game.camera.x = control.cameraX + control.clickX - event.x;
                    game.camera.y = control.cameraY - (control.clickY - event.y);
                }
            }
            else if (control instanceof SelectingUnits) {
                // Select units
                if (event instanceof MousePress) {
                    if (event.btn === MouseButton.Left && !event.down) {
                        game.selectUnits();
                        game.control = new DoingNothing();
                    }
                }
                else if (event instanceof MouseMove) {
                    control.currentX = game.camera.x + event.x - parent.offsetWidth / 2;
                    control.currentY = game.camera.y - (event.y - parent.offsetHeight / 2);
                    control.shiftDown = event.shiftDown;
                }
            }
            else if (control instanceof IssuingAttackMove) {
                if (event instanceof MousePress) {
                    if (event.btn === MouseButton.Left && event.down) {
                        game.issueAttackMoveOrder(parent, event);
                    }
                    game.control = new DoingNothing();
                }
            }
            else if (control instanceof IssuingMove) {
                if (event instanceof MousePress) {
                    if (event.btn === MouseButton.Left && event.down) {
                        game.issueMoveOrder(parent, event);
                    }
                    game.control = new DoingNothing();
                }
            }
        };
    }

    private issueMoveOrder(parent: HTMLElement, event: MousePress) {
        let selected: number[] = new Array();

        for (let i = 0; i < this.souls.length; i++) {
            let soul = this.souls[i];

            if (soul && soul.current.isSelected) {
                selected.push(i);
            }
        }

        this.chef.put8(0);
        if (event.shiftDown) {
            this.chef.put8(1);
        }
        else {
            this.chef.put8(0);
        }

        this.chef.put16(selected.length);
        this.chef.putF64((this.camera.x + (event.x - parent.offsetWidth / 2)) / Game.TILESIZE);
        this.chef.putF64((this.camera.y - (event.y - parent.offsetHeight / 2)) / Game.TILESIZE);

        for (let i = 0; i < selected.length; i++) {
            this.chef.put16(selected[i]);
        }
        this.connection.send(this.chef.done());
    }

    private issueAttackMoveOrder(parent: HTMLElement, event: MousePress) {
        let selected: number[] = new Array();

        for (let i = 0; i < this.souls.length; i++) {
            let soul = this.souls[i];

            if (soul && soul.current.isSelected) {
                selected.push(i);
            }
        }

        this.chef.put8(3);
        if (event.shiftDown) {
            this.chef.put8(1);
        }
        else {
            this.chef.put8(0);
        }

        this.chef.put16(selected.length);
        this.chef.putF64((this.camera.x + (event.x - parent.offsetWidth / 2)) / Game.TILESIZE);
        this.chef.putF64((this.camera.y - (event.y - parent.offsetHeight / 2)) / Game.TILESIZE);

        for (let i = 0; i < selected.length; i++) {
            this.chef.put16(selected[i]);
        }
        this.connection.send(this.chef.done());
    }

    private selectUnits() {
        let control = this.control;
        if (control instanceof SelectingUnits) {
            for (let i = 0; i < this.souls.length; i++) {
                let soul = this.souls[i];

                if (soul) {
                    if (soul.current.team === this.team && soul.current.isBeingSelected) {
                        soul.current.isSelected = true;
                    }
                    else if (!control.shiftDown) {
                        soul.current.isSelected = false;
                    }
                }
            }
        }

        // Configure command card
        let cmdSet: { [index: string]: void } = {};
        let bldSet: { [index: string]: void } = {};
        for (let i = 0; i < this.souls.length; i++) {
            let soul = this.souls[i];

            if (soul && soul.current.isSelected) {
                soul.current.buildables(bldSet);
                soul.current.commands(cmdSet);
            }
        }

        let cmds: string[] = [];
        for (let cmd in cmdSet) {
            if (cmdSet.hasOwnProperty(cmd)) {
                cmds.push(cmd);
            }
        }

        let blds: string[] = [];
        for (let bld in bldSet) {
            if (bldSet.hasOwnProperty(bld)) {
                blds.push(bld);
            }
        }

        cmds.sort();
        blds.sort();

        this.commandPanel.renderCommands(cmds.concat(blds));
    }

    private configureUnitsBeingSelected() {
        let control = this.control;
        if (control instanceof SelectingUnits) {
            let minX = Math.min(control.clickX, control.currentX);
            let minY = Math.min(control.clickY, control.currentY);
            let maxX = Math.max(control.clickX, control.currentX);
            let maxY = Math.max(control.clickY, control.currentY);

            for (let i = 0; i < this.souls.length; i++) {
                let soul = this.souls[i];

                if (soul && soul.new && soul.new.team === this.team) {
                    let x = soul.current.x;
                    let y = soul.current.y;
                    let r = soul.current.getRadius() * Game.TILESIZE;
                    let rSqrd = r * r;

                    let nDif = y - maxY;
                    let sDif = y - minY;
                    let eDif = x - maxX;
                    let wDif = x - minX;

                    if (y >= minY && y <= maxY) {
                        if (x + r >= minX && x - r <= maxX) {
                            soul.current.isBeingSelected = true;
                        }
                        else if (!control.shiftDown) {
                            soul.current.isBeingSelected = false;
                        }
                    }
                    else if (x >= minX && x <= maxX) {
                        if (y + r >= minY && y - r <= maxY) {
                            soul.current.isBeingSelected = true;
                        }
                        else if (!control.shiftDown) {
                            soul.current.isBeingSelected = false;
                        }
                    }
                    else if (x > maxX) {
                        // Northeast
                        if (y > maxY && (nDif * nDif + eDif * eDif) <= rSqrd) {
                            soul.current.isBeingSelected = true;
                        }
                        // Southeast
                        else if (y < minY && (sDif * sDif + eDif * eDif) <= rSqrd) {
                            soul.current.isBeingSelected = true;
                        }
                        else if (!control.shiftDown) {
                            soul.current.isBeingSelected = false;
                        }
                    }
                    else if (x < minX) {
                        // Northwest
                        if (y > maxY && (nDif * nDif + wDif * wDif) <= rSqrd) {
                            soul.current.isBeingSelected = true;
                        }
                        // Southwest
                        else if (y < minY && (sDif * sDif + wDif * wDif) <= rSqrd) {
                            soul.current.isBeingSelected = true;
                        }
                        else if (!control.shiftDown) {
                            soul.current.isBeingSelected = false;
                        }
                    }
                    else if (!control.shiftDown) {
                        soul.current.isBeingSelected = false;
                    }
                }
            }
        }
    }

    public draw() {
        let currentTime = Date.now();
        let timeDelta = (currentTime - this.lastDrawTime) * this.fps / 1000;
        this.configureUnitsBeingSelected();
        this.stepUnits(timeDelta);
        this.stepMissiles(timeDelta);
        this.tileDrawer.draw(this.camera.x, this.camera.y, 1);
        this.drawSelections();
        this.drawSelectBox();
        this.drawUnitsAndMissiles();
        this.drawFogOfWar();
        this.lastDrawTime = currentTime;
    }

    private stepUnits(timeDelta: number) {
        for (let i = 0; i < this.souls.length; i++) {
            var soul = this.souls[i];
            if (soul && soul.current && soul.new && soul.old) {
                //let tcDelta = (this.lastLogicFrameTime - soul.old.timeCreated) * this.fps / 1000;
                soul.current.step(timeDelta, soul.old, soul.new);
            }
        }
    }

    private stepMissiles(timeDelta: number) {
        for (let i = 0; i < this.missileSouls.length; i++) {
            var soul = this.missileSouls[i];
            if (soul && soul.old) {
                soul.current.step(this.fps, timeDelta, soul.old, soul.new);
            }
        }
    }

    private drawSelectBox() {
        let control = this.control;
        if (control instanceof SelectingUnits) {
            let minX = Math.min(control.clickX, control.currentX);
            let minY = Math.min(control.clickY, control.currentY);
            let maxX = Math.max(control.clickX, control.currentX);
            let maxY = Math.max(control.clickY, control.currentY);
            let minBoxX = minX - this.camera.x;
            let minBoxY = minY - this.camera.y;
            let maxBoxX = maxX - this.camera.x;
            let maxBoxY = maxY - this.camera.y;
            this.selectionBoxDrawer.draw(minBoxX, minBoxY, maxBoxX, maxBoxY);
        }
    }

    private drawUnitsAndMissiles() {
        let layers: { x: number; y: number; ang: number; ref: string }[][] = new Array(10);

        for (let i = 0; i < layers.length; i++) {
            layers[i] = new Array();
        }
        
        // Render units
        for (let i = 0; i < this.souls.length; i++) {
            let soul = this.souls[i];

            if (soul) {
                soul.current.render(this, layers);
            }
        }

        // Render missiles
        for (let i = 0; i < this.missileSouls.length; i++) {
            let soul = this.missileSouls[i];

            if (soul) {
                if (soul.current.exploding) {
                    soul.current.renderExplosion(this, layers);
                    this.missileSouls[i] = null;
                }
                else {
                    soul.current.render(this, layers);
                }
            }
        }

        let flattened: { x: number; y: number; ang: number; ref: string }[] = new Array();

        for (let i = 0; i < layers.length; i++) {
            for (let n = 0; n < layers[i].length; n++) {
                flattened.push(layers[i][n]);
            }
        }

        this.unitDrawer.draw(this.camera.x, this.camera.y, 1, flattened);
    }

    private drawSelections() {
        let selections: { x: number; y: number; r: number }[] = new Array();
        // Render units
        for (let i = 0; i < this.souls.length; i++) {
            let soul = this.souls[i];

            if (soul && (soul.current.isSelected || soul.current.isBeingSelected)) {
                selections.push({ x: soul.current.x, y: soul.current.y, r: soul.current.getRadius() });
            }
        }

        this.selectionDrawer.draw(this.camera.x, this.camera.y, 1, selections);
    }

    private drawFogOfWar() {
        let circles: { x: number; y: number; r: number }[] = new Array();

        for (let i = 0; i < this.souls.length; i++) {
            let soul = this.souls[i];

            if (soul) {
                if (soul.current.team === this.team) {
                    circles.push({ x: soul.current.x, y: soul.current.y, r: soul.current.getSightRadius() });
                }
            }
        }

        this.fowDrawer.draw(this.camera.x, this.camera.y, 1, circles);
    }
}

interface Control { }

class DoingNothing implements Control { }
class IssuingAttackMove implements Control { }
class IssuingMove implements Control { }

class SelectingUnits implements Control {
    clickX: number;
    clickY: number;
    currentX: number;
    currentY: number;
    shiftDown: boolean;

    constructor(mx: number, my: number, cx: number, cy: number, sd: boolean) {
        this.clickX = mx;
        this.clickY = my;
        this.currentX = cx;
        this.currentY = cy;
        this.shiftDown = sd;
    }
}

class MovingCamera implements Control {
    clickX: number;
    clickY: number;
    cameraX: number;
    cameraY: number;

    constructor(mx: number, my: number, cx: number, cy: number) {
        this.clickX = mx;
        this.clickY = my;
        this.cameraX = cx;
        this.cameraY = cy;
    }
}

class Camera {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}