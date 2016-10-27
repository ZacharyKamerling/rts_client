﻿"use strict";
class Game {
    public static MAX_UNITS = 4096;
    public static TILESIZE = 32;
    public connected: boolean = true;
    public chef: Chef = null;
    public tileDrawer: TileDrawer = null;
    public unitDrawer: UnitDrawer = null;
    public fowDrawer: FOWDrawer = null;
    public commandPanel: CommandPanel = null;
    public selectionDrawer: SelectionDrawer = null;
    public selectionBoxDrawer: SelectionBoxDrawer = null;
    public control: Interaction.Core.Control = new Interaction.Core.DoingNothing();
    public camera: Camera = new Camera(0, 0);
    public connection: WebSocket = null;
    public souls: { old: Unit, current: Unit, new: Unit }[] = null;
    public missileSouls: { old: Missile, current: Missile, new: Missile }[] = null;
    public logicFrame: number = 0;
    public lastDrawTime: number = 0;
    public lastLogicFrameTime: number = 0;
    public team: number = 0;
    public metal: number = 0;
    public energy: number = 0;
    public static FPS = 10;

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

    public commandPanelHandler(): (name: string) => void {
        let game = this;
        return function (name: string) {
            switch (name) {
                case "move":
                    game.control = new Interaction.MoveOrder.BeingIssued();
                    break;
                case "attack":
                    game.control = new Interaction.AttackMoveOrder.BeingIssued();
                    break;
                case "build":
                    game.control = new Interaction.BuildOrder.BeingIssued(3, 3, 1, "building");
                    break;
                default:
                    game.control = new Interaction.Core.DoingNothing();
                    break;
            }
        };
    }

    

    public draw() {
        let currentTime = Date.now();
        let timeDelta = (currentTime - this.lastDrawTime) * Game.FPS / 1000;
        Interaction.SelectingUnits.configUnitSelections(this);
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
                soul.current.step(Game.FPS, timeDelta, soul.old, soul.new);
            }
        }
    }

    private drawSelectBox() {
        let control = this.control;
        if (control instanceof Interaction.SelectingUnits.CurrentAction) {
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
        let selections: { x: number; y: number; radius: number; r: number; g: number; b: number; a: number }[] = new Array();
        // Render units
        for (let i = 0; i < this.souls.length; i++) {
            let soul = this.souls[i];

            if (soul && (soul.current.isSelected || soul.current.isBeingSelected)) {
                let r = 255 * Math.min(1, (1 - soul.current.health) * 2);
                let g = 255 * Math.min(1, (1 - soul.current.health) * 2);
                let b = 255 * Math.min(1, soul.current.health * 2);
                let a = 255;
                selections.push({ x: soul.current.x, y: soul.current.y, radius: soul.current.getRadius(), r: r, g: g, b: b, a: a});
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

class Camera {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}