"use strict";

function main() {
    let mainMenu = document.getElementById('mainMenu');
    let content = document.getElementById('content');
    let chef = new Chef();
    let connectBtn = document.getElementById('connectBtn');
    let connected = false;
    let thingsLoaded = 0;
    let conn: WebSocket = null;
    let game: Game = new Game();
    let fowCanvas = <HTMLCanvasElement>document.getElementById('fowCanvas');
    let drawCanvas = <HTMLCanvasElement>document.getElementById('drawCanvas');
    let minimapCanvas = <HTMLCanvasElement>document.getElementById('minimapCanvas');
    let ctrlDiv = <HTMLElement>document.getElementById('controlDiv');
    let cmdDiv = <HTMLElement>document.getElementById('commandDiv');
    let cmds = commands();

    let json = JSON.stringify({
            "spriteGraphics": [{
                "facing": 0,
                "xOffset": 0,
                "yOffset": 0,
                "layer": 0,
                "cycleRate": 0,
                "cycleCurrent": 0,
                "imgRef": "basic_unit"
            }],
            "name": "Medium1",
            "radius": 0.64,
            "collision_radius": 0.96,
            "collision_ratio": 0.625,
            "collision_resist": 0.8,
            "width_and_height": null,
            "weight": 1.0,
            "top_speed": 2.0,
            "acceleration": 1.0,
            "deceleration": 3.0,
            "turn_rate": 2.0,
            "max_health": 125.0,
            "health_regen": 0.0,
            "build_cost": 100.0,
            "prime_cost": 100.0,
            "energy_cost": 100.0,
            "prime_output": 0.0,
            "energy_output": 0.0,
            "prime_storage": 0.0,
            "energy_storage": 0.0,
            "build_rate": 5.0,
            "build_range": 4.0,
            "build_roster": ["extractor1", "artillery1"],
            "train_rate": 0.0,
            "train_roster": [],
            "weapons":
            [{
                "name": "KEB9",
                "attack": {
                    "attack_type": "missile",
                    "missile_name": "Medium1"
                },
                "xy_offset": { "x": 0.0, "y": 0.0 },
                "turn_rate": 3.14,
                "lock_offset": 0.0,
                "firing_arc": 4.0,
                "range": 12.0,
                "firing_offset": 0.75,
                "fire_rate": 1.0,
                "alternating": false,
                "barrels": 1,
                "barrel_spacing": 0.0,
                "salvo_size": 1,
                "salvo_fire_rate": 0.0,
                "pellet_count": 1,
                "pellet_spread": 0.01,
                "target_type": ["ground"],
                "missile_speed": 24.0,
                "spriteGraphic": {
                    "facing": 0,
                    "xOffset": 0,
                    "yOffset": 0,
                    "layer": 0,
                    "cycleRate": 0,
                    "cycleCurrent": 0,
                    "imgRef": "basic_wpn"
                }
            }],
            "capacity": 0,
            "size": 0,
            "target_type": ["ground"],
            "move_type": "ground",
            "collision_type": ["ground"],
            "is_structure": false,
            "is_extractor": false,
            "engagement_range": 16.0,
            "sight_range": 16.0,
            "sight_duration": 0.0,
            "radar_range": 0.0,
            "radar_duration": 0.0,
            "stealth_range": 0.0,
            "stealth_duration": 0.0
        });

    let unit_proto = new Unit();
    unit_proto.jsonConfig(json);
    game.unitPrototypes.push(unit_proto.clone());
    game.unitPrototypes.push(unit_proto.clone());
    game.unitPrototypes.push(unit_proto.clone());
    game.unitPrototypes.push(unit_proto.clone());
    
    game.chef = chef;
    game.inputState = new UserInput.InputState();
    game.tileDrawer = new TileDrawer(drawCanvas, 'img/tileset.png', 'img/lttp-all.png');
    game.fowDrawer = new FOWDrawer(fowCanvas);
    game.selectionDrawer = new SelectionDrawer(drawCanvas);
    game.selectionBoxDrawer = new SelectionBoxDrawer(drawCanvas);
    game.minimapBoxDrawer = new MinimapBoxDrawer(minimapCanvas);
    game.statusBarDrawer = new StatusBarDrawer(drawCanvas);
    game.commandPanel = new CommandPanel(cmdDiv, cmds, game.commandPanelHandler());

    let spritemap = new SpriteMap(spriteRefs(game.teamColors));
    spritemap.onload = function (e: Event) {
        game.unitDrawer = new UnitDrawer(drawCanvas, spritemap);
        game.minimapDrawer = new MinimapDrawer(minimapCanvas, spritemap);
        game.buildPlacementDrawer = new BuildPlacementDrawer(drawCanvas, spritemap);
        mainMenu.appendChild(spritemap.spriteSheet);
    };

    connectBtn.onclick = function () {
        let nameFieldValue = (<HTMLInputElement>document.getElementById('nameField')).value;
        let passFieldValue = (<HTMLInputElement>document.getElementById('passField')).value;
        let addrFieldValue = (<HTMLInputElement>document.getElementById('addrField')).value;
        let portFieldValue = (<HTMLInputElement>document.getElementById('portField')).value;
        console.log('Attempting connection...');

        if (addrFieldValue === "localhost") {
            conn = new WebSocket('ws://localhost:' + portFieldValue);
        }
        else {
            conn = new WebSocket('ws://[' + addrFieldValue + ']:' + portFieldValue);
        }

        conn.binaryType = "arraybuffer";
        game.connection = conn;

        conn.onclose = function () {
            console.log('Connection closed.');
            mainMenu.hidden = false;
            content.hidden = true;
            game.connected = false;
            game.reset();
        }

        conn.onmessage = function (event) {
            Decoding.processPacket(game, new Cereal(new DataView(event.data)));
        }

        conn.onopen = function () {
            console.log('Connection open.');
            mainMenu.hidden = true;
            content.hidden = false;
            chef.putString(nameFieldValue);
            chef.putString(passFieldValue);
            conn.send(chef.done());
            
            chef.putU8(Interaction.Core.ServerMessage.MapInfoRequest);
            chef.putU32(game.orderID++);
            conn.send(chef.done());

            game.connected = true;
            game.inputState.addListener(minimapCanvas, Interaction.Minimap.interact(game));
            game.inputState.addListener(ctrlDiv, Interaction.Core.interact(game));
            playGame(game);
        }

        conn.onerror = function () {
            console.log('Connection Error.');
            mainMenu.hidden = false;
            content.hidden = true;
            game.connected = false;
            game.reset();
        }
    };
};

function playGame(game: Game) {
    function draw() {
        if (game.connected) {
            game.draw();
            requestAnimationFrame(draw);
        }
    }

    draw();
}

function commands(): { [index: string]: { src: string, tooltip: string } } {
    let cmds: { [index: string]: { src: string, tooltip: string } } = {};
    cmds["attack"] = { src: "img/attack.png", tooltip: "[A] Attack" };
    cmds["move"] = { src: "img/move.png", tooltip: "[M] Move" };
    cmds["buildArtillery1"] = { src: "img/build.png", tooltip: "[B] Build T1 Artillery" };
    cmds["buildExtractor1"] = { src: "img/build.png", tooltip: "[Q] Build T1 Extractor" };

    return cmds;
}

function spriteRefs(colors: TeamColor[]): { src: string, ref: string, color: TeamColor }[] {
    let tc_imgs = [
        {
            src: "img/basic_missile.png",
            ref: "basic_missile"
        },
        {
            src: "img/platform1.png",
            ref: "platform1"
        },
        {
            src: "img/platform2.png",
            ref: "platform2"
        },
        {
            src: "img/extractor_blade1.png",
            ref: "extractor_blade1"
        },
        {
            src: "img/artillery_wpn1.png",
            ref: "artillery_wpn1"
        },
        {
            src: "img/artillery_wpn2.png",
            ref: "artillery_wpn2"
        },
        {
            src: "img/missile1.png",
            ref: "missile1"
        },
        {
            src: "img/basic_unit.png",
            ref: "basic_unit"
        },
        {
            src: "img/basic_wpn.png",
            ref: "basic_wpn"
        },
        {
            src: "img/fast1.png",
            ref: "fast1"
        },
        {
            src: "img/fast_wpn1.png",
            ref: "fast_wpn1"
        },
        {
            src: "img/fast_msl1.png",
            ref: "fast_msl1"
        },
        {
            src: "img/fighter1.png",
            ref: "fighter1"
        },
        {
            src: "img/bomber1.png",
            ref: "bomber1"
        },
        {
            src: "img/minimap_unit.png",
            ref: "minimap_unit"
        },
    ];

    let list: { src: string, ref: string, color: TeamColor }[] = new Array();

    for (let i = 0; i < colors.length; i++) {
        let color = colors[i];

        for (let n = 0; n < tc_imgs.length; n++) {
            let src = tc_imgs[n].src;
            let ref = tc_imgs[n].ref + color.name;
            list.push({ src: src, ref: ref, color: color });
        }
    }

    list.push({
        src: "img/Prime_deposit.png",
        ref: "prime_node",
        color: new TeamColor(),
    });

    return list;
}

main();