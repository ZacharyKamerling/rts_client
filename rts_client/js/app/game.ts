"use strict";
class Game {
    public static MAX_UNITS = 4096;
    public static TILESIZE = 20;
    public static PRIME_NODE_WIDTH = 3;
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
    public camera: Camera = new Camera(0, 0, 1);
    public connection: WebSocket = null;
    public unitPrototypes: Unit[] = new Array();
    public missilePrototypes: Missile[] = new Array();
    public souls: { old: Unit, current: Unit, new: Unit }[] = null;
    public missileSouls: { old: Missile, current: Missile, new: Missile }[] = null;
    public logicFrame: number = 0;
    public lastDrawTime: number = 0;
    public lastLogicFrameTime: number = 0;
    public teamColors: TeamColor[];
    public mapWidth: number = 0;
    public mapHeight: number = 0;
    public team: number = 0;
    public maxPrime: number = 0;
    public maxEnergy: number = 0;
    public prime: number = 0;
    public energy: number = 0;
    public primeOutput: number = 0;
    public primeDrain: number = 0;
    public energyOutput: number = 0;
    public energyDrain: number = 0;
    public orderID: number = 0;
    public primeNodes: { x: number, y: number }[] = new Array();
    public static FPS = 10;

    constructor() {
        this.souls = Array(Game.MAX_UNITS);

        for (let i = 0; i < Game.MAX_UNITS; i++) {
            this.souls.push(null);
        }

        this.missileSouls = Array();

        for (let i = 0; i < Game.MAX_UNITS * 4; i++) {
            this.missileSouls.push(null);
        }

        this.teamColors = Array();

        let tc = new TeamColor();
        tc.name = "white";
        tc.red = 1.0;
        tc.green = 1.0;
        tc.blue = 1.0;
        this.teamColors.push(tc.clone());
        tc.name = "purple";
        tc.red = 0.8;
        tc.green = 0.0;
        tc.blue = 1.0;
        this.teamColors.push(tc.clone());
        tc.name = "green";
        tc.red = 0.0;
        tc.green = 0.9;
        tc.blue = 0.0;
        this.teamColors.push(tc.clone());
        tc.name = "aqua";
        tc.red = 0.0;
        tc.green = 1.0;
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
                case "stop":
                    Interaction.StopOrder.issue(game);
                    break;
                default:
                    if (name.startsWith("build_")) {
                        game.buildOrderHandler(name.slice("build_".length));
                    }
                    else {
                        console.log('commandPanelHandler couldn\'t handle: ' + name);
                        game.control = new Interaction.Core.DoingNothing();
                    }
                    break;
            }
        };
    }

    private buildOrderHandler(name: string) {
        for (let i = 0; i < this.unitPrototypes.length; i++) {
            let proto = this.unitPrototypes[i];
            if (proto.name === name) {
                if (proto.is_structure) {
                    let imgs = new Array();
                    for (let img of proto.sprite_graphics) {
                        imgs.push(img.img_ref);
                    }
                    this.control = new Interaction.BuildOrder.BeingIssued(proto.width_and_height.w, proto.width_and_height.h, i, imgs);
                }
                else {
                    Interaction.TrainOrder.issue(this, proto);
                }
            }
        }
    }

    public draw() {
        let currentTime = Date.now();
        let timeDelta = (currentTime - this.lastDrawTime) * Game.FPS / 1000;
        Interaction.SelectingUnits.configUnitSelections(this);
        this.stepUnits(timeDelta);
        this.stepMissiles(timeDelta);
        this.tileDrawer.draw(this.camera.x, this.camera.y, this.camera.scale);
        this.drawPrimeNodes();
        this.drawSelections();
        this.drawUnitsAndMissiles();
        this.drawBuildPlacement();
        this.drawFogOfWar();
        this.drawStatusBars();
        this.drawSelectBox();
        this.drawMinimap();
        this.drawResourceBars();
        this.lastDrawTime = currentTime;
    }

    private drawResourceBars() {
        let primeBar = <HTMLDivElement>document.getElementById('primeBar');
        let primeOutput = <HTMLLabelElement>document.getElementById('primeOutput');
        let primeDrain = <HTMLLabelElement>document.getElementById('primeDrain');
        let primeMaximum = <HTMLLabelElement>document.getElementById('primeMaximum');
        let primeAmount = <HTMLLabelElement>document.getElementById('primeAmount');
        primeBar.style.width = Math.max(0.5, this.prime / this.maxPrime * 256) + "px";
        primeOutput.textContent = "+" + this.primeOutput.toFixed(1);
        primeDrain.textContent = "-" + this.primeDrain.toFixed(1);
        primeAmount.textContent = this.prime.toString();
        primeMaximum.textContent = this.maxPrime.toString();

        let energyBar = <HTMLDivElement>document.getElementById('energyBar');
        let energyOutput = <HTMLLabelElement>document.getElementById('energyOutput');
        let energyDrain = <HTMLLabelElement>document.getElementById('energyDrain');
        let energyMaximum = <HTMLLabelElement>document.getElementById('energyMaximum');
        let energyAmount = <HTMLLabelElement>document.getElementById('energyAmount');
        energyBar.style.width = Math.max(0.5, this.energy / this.maxEnergy * 256) + "px";
        energyOutput.textContent = "+" + this.energyOutput.toFixed(1);
        energyDrain.textContent = "-" + this.energyDrain.toFixed(1);
        energyAmount.textContent = this.energy.toString();
        energyMaximum.textContent = this.maxEnergy.toString();
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
                soul.current.step(timeDelta, soul.old, soul.new);
            }
        }
    }

    private drawPrimeNodes() {
        let nodes = new Array();
        // Draw prime nodes
        for (let i = 0; i < this.primeNodes.length; i++) {
            let node = this.primeNodes[i];
            let x = node.x;
            let y = node.y;
            nodes.push({ x: x, y: y, ang: 0, ref: 'prime_node' });
        }

        this.unitDrawer.draw(this.camera.x, this.camera.y, this.camera.scale, nodes);
    }

    private drawSelectBox() {
        let control = this.control;
        if (control instanceof Interaction.SelectingUnits.CurrentAction) {
            let scale = this.camera.scale;
            let width = this.unitDrawer.width();
            let height = this.unitDrawer.height();
            let x1 = (control.clickX - this.camera.x) * scale;
            let y1 = (control.clickY - this.camera.y) * scale;
            let x2 = (control.currentX - this.camera.x) * scale;
            let y2 = (control.currentY - this.camera.y) * scale;
            let minX = Math.min(x1, x2);
            let minY = Math.min(y1, y2);
            let maxX = Math.max(x1, x2);
            let maxY = Math.max(y1, y2);
            this.selectionBoxDrawer.draw(minX, minY, maxX, maxY);
        }
    }

    public gameXY(): { x: number, y: number } {
        let self = this;
        return {
            x: (self.camera.x + (self.inputState.mouseX() - self.unitDrawer.width() / 2) / self.camera.scale) / Game.TILESIZE,
            y: (self.camera.y - (self.inputState.mouseY() - self.unitDrawer.height() / 2) / self.camera.scale) / Game.TILESIZE,
        };
    }

    private drawBuildPlacement() {
        let control = this.control;
        let input = this.inputState;

        if (control instanceof Interaction.BuildOrder.BeingIssued) {
            let layers: { x: number; y: number; ang: number, ref: string }[] = new Array();
            let xy = this.gameXY();
            let hw = control.width * 0.5;
            let hh = control.height * 0.5;
            let x = (Math.floor(xy.x - hw + 0.0001) + hw) * Game.TILESIZE;
            let y = (Math.floor(xy.y - hh + 0.0001) + hh) * Game.TILESIZE;

            for (let i = 0; i < control.imgs.length; i++) {
                layers.push({
                    x: x, y: y, ang: 0.0, ref: this.teamColors[this.team].name + '/' + control.imgs[i]
                });
            }
            this.buildPlacementDrawer.draw(this.camera.x, this.camera.y, this.camera.scale, layers);
        }
    }

    private drawMinimap() {
        let layers: { x: number; y: number; ang: number; ref: string }[][] = new Array(10);

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

        let flattened: { x: number; y: number; ref: string }[] = new Array();

        for (let i = 0; i < layers.length; i++) {
            for (let n = 0; n < layers[i].length; n++) {
                let tmp = layers[i][n];
                tmp.x = tmp.x / Game.TILESIZE / this.mapWidth;
                tmp.y = tmp.y / Game.TILESIZE / this.mapHeight;
                flattened.push(tmp);
            }
        }
        let scale = this.camera.scale;
        let mapW = this.mapWidth * Game.TILESIZE;
        let mapH = this.mapHeight * Game.TILESIZE;
        let drawCanvas = <HTMLCanvasElement>document.getElementById('drawCanvas');
        let w = drawCanvas.clientWidth;
        let h = drawCanvas.clientHeight;
        let hw = w / 2 / scale;
        let hh = h / 2 / scale;
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
                    //soul.current.renderExplosion(this, layers);
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

        this.unitDrawer.draw(this.camera.x, this.camera.y, this.camera.scale, flattened);
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
                    let radius = soul.current.collision_radius;
                    let r = 0;
                    let g = 255;
                    let b = 100;
                    let a = 255;
                    if (soul.current.is_selected) {
                        onlyEnemyIsSelected = false;
                        selections.push({ x: x, y: y, radius: radius * Game.TILESIZE, r: r, g: g, b: b, a: a });
                    }
                    else if (soul.current.is_being_selected) {
                        onlyEnemyIsBeingSelected = false;
                        dashed.push({ x: x, y: y, radius: radius * Game.TILESIZE, r: r, g: g, b: b, a: a });
                    }
                }
                else {
                    let x = soul.current.x;
                    let y = soul.current.y;
                    let radius = soul.current.collision_radius;
                    let r = 255;
                    let g = 0;
                    let b = 100;
                    let a = 255;
                    if (soul.current.is_selected && onlyEnemyIsSelected) {
                        enemy_selections.push({ x: x, y: y, radius: radius * Game.TILESIZE, r: r, g: g, b: b, a: a });
                    }
                    else if (soul.current.is_being_selected && onlyEnemyIsBeingSelected) {
                        enemy_dashed.push({ x: x, y: y, radius: radius * Game.TILESIZE, r: r, g: g, b: b, a: a });
                    }
                }
            }
        }

        if (onlyEnemyIsSelected) {
            this.selectionDrawer.draw(false, this.camera.x, this.camera.y, this.camera.scale, enemy_selections);
        }
        else {
            this.selectionDrawer.draw(false, this.camera.x, this.camera.y, this.camera.scale, selections);
        }

        if (onlyEnemyIsBeingSelected) {
            this.selectionDrawer.draw(true, this.camera.x, this.camera.y, this.camera.scale, enemy_dashed);
        }
        else {
            this.selectionDrawer.draw(true, this.camera.x, this.camera.y, this.camera.scale, dashed);
        }
    }

    private drawStatusBars() {
        let bars: { x: number; y: number; w: number; h: number, v: number, r: number; g: number; b: number; a: number }[] = new Array();
        // Render units
        for (let i = 0; i < this.souls.length; i++) {
            let soul = this.souls[i];

            if (soul && soul.current && soul.old) {
                let radius = soul.current.collision_radius;
                let x = soul.current.x;
                let y = soul.current.y + radius * Game.TILESIZE;
                let w = soul.current.collision_radius * Game.TILESIZE;
                let h = 1;

                if (soul.old.progress < 255) {
                    let v = soul.old.progress / 255;
                    let r = 125;
                    let g = 125;
                    let b = 125;
                    let a = 255;
                    bars.push({ x: x, y: y - 2, w: w, h: h, v: v, r: r, g: g, b: b, a: a });
                }
                if (soul.old.health < 255) {
                    let v = soul.old.health / 255;
                    let r = (255 - soul.old.health / 2);
                    let g = 200;
                    let b = soul.old.health;
                    let a = 255;
                    bars.push({ x: x, y: y, w: w, h: h, v: v, r: r, g: g, b: b, a: a });
                }
            }
        }

        this.statusBarDrawer.draw(this.camera.x, this.camera.y, this.camera.scale, bars);
    }

    private drawFogOfWar() {
        let circles: { x: number; y: number; r: number }[] = new Array();

        for (let i = 0; i < this.souls.length; i++) {
            let soul = this.souls[i];

            if (soul) {
                if (soul.current.team === this.team) {
                    circles.push({ x: soul.current.x, y: soul.current.y, r: soul.current.sight_range });
                }
            }
        }

        this.fowDrawer.draw(this.camera.x, this.camera.y, this.camera.scale, circles);
    }
}

class Camera {
    x: number;
    y: number;
    scale: number;

    constructor(x: number, y: number, scale: number) {
        this.x = x;
        this.y = y;
        this.scale = scale;
    }
}