"use strict";
class Game {
    public static MAX_UNITS = 4096;
    public static TILESIZE = 20;
    public connected: boolean = true;
    public chef: Chef = null;
    public inputState: UserInput.InputState = null;
    public tileDrawer: TileDrawer = null;
    public unitDrawer: UnitDrawer = null;
    public minimapDrawer: MinimapDrawer = null;
    public minimapBoxDrawer: MinimapBoxDrawer = null;
    public fowDrawer: FOWDrawer = null;
    public commandPanel: CommandPanel = null;
    public selectionDrawer: SelectionDrawer = null;
    public selectionBoxDrawer: SelectionBoxDrawer = null;
    public statusBarDrawer: StatusBarDrawer = null;
    public buildPlacementDrawer: BuildPlacementDrawer = null;
    public control: Interaction.Core.Control = new Interaction.Core.DoingNothing();
    public camera: Camera = new Camera(0, 0);
    public connection: WebSocket = null;
    public souls: { old: Unit, current: Unit, new: Unit }[] = null;
    public missileSouls: { old: Missile, current: Missile, new: Missile }[] = null;
    public logicFrame: number = 0;
    public lastDrawTime: number = 0;
    public lastLogicFrameTime: number = 0;
    public teamColors: TeamColor[];
    public mapWidth: number = 0;
    public mapHeight: number = 0;
    public team: number = 0;
    public prime: number = 0;
    public energy: number = 0;
    public orderID: number = 0;
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

        this.teamColors = Array();

        let tc = new TeamColor();
        tc.name = "green";
        tc.red = 0.0;
        tc.green = 0.9;
        tc.blue = 0.0;
        this.teamColors.push(tc.clone());
        tc.name = "white";
        tc.red = 1.0;
        tc.green = 1.0;
        tc.blue = 1.0;
        this.teamColors.push(tc.clone());
        tc.name = "aqua";
        tc.red = 0.0;
        tc.green = 1.0;
        tc.blue = 1.0;
        this.teamColors.push(tc.clone());
        tc.name = "purple";
        tc.red = 0.8;
        tc.green = 0.0;
        tc.blue = 1.0;
        this.teamColors.push(tc.clone());
        
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
                    console.log('commandPanelHandler couldn\'t handle: ' + name);
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
        this.drawUnitsAndMissiles();
        this.drawBuildPlacement();
        this.drawFogOfWar();
        this.drawStatusBars();
        this.drawSelectBox();
        this.drawMinimap();
        this.lastDrawTime = currentTime;
    }

    private stepUnits(timeDelta: number) {
        for (let i = 0; i < this.souls.length; i++) {
            var soul = this.souls[i];
            if (soul && soul.current && soul.new && soul.old) {
                soul.current.step(timeDelta, soul.old, soul.new);
            }
        }
    }

    private stepMissiles(timeDelta: number) {
        for (let i = 0; i < this.missileSouls.length; i++) {
            var soul = this.missileSouls[i];
            if (soul && soul.current && soul.old && soul.new) {
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

    private drawBuildPlacement() {
        let control = this.control;
        let input = this.inputState;

        if (control instanceof Interaction.BuildOrder.BeingIssued) {
            let layers: { x: number; y: number; ang: number, ref: string }[] = new Array();

            let norm_x = (this.camera.x + (input.mouseX() - this.unitDrawer.width() / 2)) / Game.TILESIZE;
            let norm_y = (this.camera.y - (input.mouseY() - this.unitDrawer.height() / 2)) / Game.TILESIZE;
            let half_w = 4.0 / 2.0;
            let half_h = 4.0 / 2.0;
            let x = (Math.floor(norm_x - half_w + 0.00001) + half_w) * Game.TILESIZE;
            let y = (Math.floor(norm_y - half_h + 0.00001) + half_h) * Game.TILESIZE;

            layers.push({
                x: x, y: y, ang: 0.0, ref: "artillery_platform1" + this.teamColors[this.team].name
            });
            layers.push({
                x: x, y: y, ang: 0.0, ref: "artillery_wpn2" + this.teamColors[this.team].name
            });
            this.buildPlacementDrawer.draw(this.camera.x, this.camera.y, 1, layers);
        }
    }

    private drawMinimap() {
        let layers: { x: number; y: number; teamColor: TeamColor; ref: string }[][] = new Array(10);

        for (let i = 0; i < layers.length; i++) {
            layers[i] = new Array();
        }

        // Render units
        for (let i = 0; i < this.souls.length; i++) {
            let soul = this.souls[i];

            if (soul) {
                soul.current.renderMinimap(this, layers);
            }
        }

        let flattened: { x: number; y: number; teamColor: TeamColor; ref: string }[] = new Array();

        for (let i = 0; i < layers.length; i++) {
            for (let n = 0; n < layers[i].length; n++) {
                let tmp = layers[i][n];
                tmp.x = tmp.x / Game.TILESIZE / this.mapWidth;
                tmp.y = tmp.y / Game.TILESIZE / this.mapHeight;
                flattened.push(tmp);
            }
        }
        let mapW = this.mapWidth * Game.TILESIZE;
        let mapH = this.mapHeight * Game.TILESIZE;
        let drawCanvas = <HTMLCanvasElement>document.getElementById('drawCanvas');
        let w = drawCanvas.clientWidth;
        let h = drawCanvas.clientHeight;
        let hw = w / 2;
        let hh = h / 2;
        let cx = this.camera.x;
        let cy = this.camera.y;
        let x1 = (cx - hw) / mapW * 2 - 1;
        let y1 = (cy - hh) / mapH * 2 - 1;
        let x2 = (cx + hw) / mapW * 2 - 1;
        let y2 = (cy + hh) / mapH * 2 - 1;
        this.minimapDrawer.draw(flattened);
        this.minimapBoxDrawer.draw(x1, y1, x2, y2);
    }

    private drawUnitsAndMissiles() {
        let layers: { x: number; y: number; ang: number; teamColor: TeamColor; ref: string }[][] = new Array(10);

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

        let flattened: { x: number; y: number; ang: number; teamColor: TeamColor; ref: string }[] = new Array();

        for (let i = 0; i < layers.length; i++) {
            for (let n = 0; n < layers[i].length; n++) {
                flattened.push(layers[i][n]);
            }
        }

        this.unitDrawer.draw(this.camera.x, this.camera.y, 1, flattened);
    }

    private drawSelections() {
        let selections: { x: number; y: number; radius: number; r: number; g: number; b: number; a: number }[] = new Array();
        let dashed: { x: number; y: number; radius: number; r: number; g: number; b: number; a: number }[] = new Array();
        let enemy_selections: { x: number; y: number; radius: number; r: number; g: number; b: number; a: number }[] = new Array();
        let enemy_dashed: { x: number; y: number; radius: number; r: number; g: number; b: number; a: number }[] = new Array();

        let onlyEnemyIsBeingSelected = true;
        let onlyEnemyIsSelected = true;
        // Render units
        for (let i = 0; i < this.souls.length; i++) {
            let soul = this.souls[i];

            if (soul) {
                if (soul.current.team === this.team) {
                    let x = soul.current.x;
                    let y = soul.current.y;
                    let radius = soul.current.radius();
                    let r = 0;
                    let g = 255;
                    let b = 100;
                    let a = 255;
                    if (soul.current.isSelected) {
                        onlyEnemyIsSelected = false;
                        selections.push({ x: x, y: y, radius: radius * Game.TILESIZE, r: r, g: g, b: b, a: a });
                    }
                    else if (soul.current.isBeingSelected) {
                        onlyEnemyIsBeingSelected = false;
                        dashed.push({ x: x, y: y, radius: radius * Game.TILESIZE, r: r, g: g, b: b, a: a });
                    }
                }
                else {
                    let x = soul.current.x;
                    let y = soul.current.y;
                    let radius = soul.current.radius();
                    let r = 255;
                    let g = 0;
                    let b = 100;
                    let a = 255;
                    if (soul.current.isSelected && onlyEnemyIsSelected) {
                        enemy_selections.push({ x: x, y: y, radius: radius * Game.TILESIZE, r: r, g: g, b: b, a: a });
                    }
                    else if (soul.current.isBeingSelected && onlyEnemyIsBeingSelected) {
                        enemy_dashed.push({ x: x, y: y, radius: radius * Game.TILESIZE, r: r, g: g, b: b, a: a });
                    }
                }
            }
        }

        if (onlyEnemyIsSelected) {
            this.selectionDrawer.draw(false, this.camera.x, this.camera.y, enemy_selections);
        }
        else {
            this.selectionDrawer.draw(false, this.camera.x, this.camera.y, selections);
        }

        if (onlyEnemyIsBeingSelected) {
            this.selectionDrawer.draw(true, this.camera.x, this.camera.y, enemy_dashed);
        }
        else {
            this.selectionDrawer.draw(true, this.camera.x, this.camera.y, dashed);
        }
    }

    private drawStatusBars() {
        let bars: { x: number; y: number; w: number; h: number, v: number, r: number; g: number; b: number; a: number }[] = new Array();
        // Render units
        for (let i = 0; i < this.souls.length; i++) {
            let soul = this.souls[i];

            if (soul && soul.current) {
                let radius = soul.current.radius();
                let x = soul.current.x;
                let y = soul.current.y + radius * Game.TILESIZE;
                let w = soul.current.radius() * Game.TILESIZE;
                let h = 2;

                if (soul.current.progress < 254.99) {
                    let v = soul.current.progress / 255;
                    let r = 175;
                    let g = 175;
                    let b = 175;
                    let a = 255;
                    bars.push({ x: x, y: y - 2, w: w, h: h, v: v, r: r, g: g, b: b, a: a });
                }
                if (soul.current.health < 254.99) {
                    let v = soul.current.health / 255;
                    let r = (255 - soul.current.health);
                    let g = (255 - soul.current.health);
                    let b = soul.current.health;
                    let a = 255;
                    bars.push({ x: x, y: y, w: w, h: h, v: v, r: r, g: g, b: b, a: a });
                }
            }
        }

        this.statusBarDrawer.draw(this.camera.x, this.camera.y, 1, bars);
    }

    private drawFogOfWar() {
        let circles: { x: number; y: number; r: number }[] = new Array();

        for (let i = 0; i < this.souls.length; i++) {
            let soul = this.souls[i];

            if (soul) {
                if (soul.current.team === this.team) {
                    circles.push({ x: soul.current.x, y: soul.current.y, r: soul.current.sightRadius() });
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