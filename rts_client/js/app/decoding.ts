﻿module Decoding {

    enum ClientMessage {
        UnitMove,
        UnitDeath,
        OrderCompleted,
        MissileMove,
        MissileExplode,
        TeamInfo,
        MapInfo,
    }

    export function processPacket(game: Game, data: Cereal): void {
        let currentTime = Date.now();
        let logicFrame = data.getU32();

        if (logicFrame > game.logicFrame) {
            game.logicFrame = logicFrame;
            game.lastLogicFrameTime = currentTime;

            for (let i = 0; i < game.souls.length; i++) {
                let soul = game.souls[i];
                if (soul && (logicFrame - soul.new.frameCreated > 2)) {
                    game.souls[i] = null;
                }
            }

            for (let i = 0; i < game.missileSouls.length; i++) {
                let misl_soul = game.missileSouls[i];
                if (misl_soul && (logicFrame - misl_soul.new.frameCreated > 1)) {
                    game.missileSouls[i] = null;
                }
            }
        }
        else if (logicFrame < game.logicFrame) {
            return;
        }

        while (!data.empty()) {
            let msg_type = data.getU8();

            msg_switch:
            switch (msg_type) {
                // Unit
                case ClientMessage.UnitMove:
                    let new_unit: Unit = Unit.decodeUnit(data, currentTime, logicFrame);

                    // If unit_soul exists, update it with new_unit
                    if (new_unit) {
                        let soul = game.souls[new_unit.unit_ID];

                        if (soul) {
                            soul.old = soul.current.clone();
                            soul.old.timeCreated = soul.new.timeCreated;
                            soul.new = new_unit;
                        }
                        else {
                            var cur = new_unit.clone();
                            game.souls[new_unit.unit_ID] = { old: null, current: cur, new: new_unit };
                        }
                    }
                    break msg_switch;
                // Missile
                case ClientMessage.MissileMove:
                case ClientMessage.MissileExplode:
                    let exploding = msg_type === ClientMessage.MissileExplode;
                    let new_misl: Missile = Missile.decodeMissile(data, currentTime, logicFrame, exploding);

                    if (new_misl) {
                        let soul = game.missileSouls[new_misl.misl_ID];

                        if (soul) {
                            soul.old = soul.current.clone();
                            soul.old.timeCreated = soul.new.frameCreated;
                            soul.new = new_misl;
                        }
                        else {
                            let cur = new_misl.clone();
                            game.missileSouls[new_misl.misl_ID] = { old: null, current: cur, new: new_misl };
                        }
                    }
                    break msg_switch;
                // Unit death
                case ClientMessage.UnitDeath:
                    let unit_ID = data.getU16();
                    let dmg_type = data.getU8();
                    game.souls[unit_ID].current.isDead = true;
                    break msg_switch;
                // Player Info
                case ClientMessage.TeamInfo:
                    game.team = data.getU8();
                    game.metal = data.getU32();
                    game.energy = data.getU32();
                    break msg_switch;
                // Player Info
                case ClientMessage.OrderCompleted:
                    let unitID = data.getU16();
                    let orderID = data.getU16();
                    break msg_switch;
                case ClientMessage.MapInfo:
                    console.log("Received map data. " + data.dv.byteLength);
                    let width = data.getU16();
                    let height = data.getU16();
                    let canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    let ctx = canvas.getContext('2d');
                    let imgData = ctx.getImageData(0, 0, width, height);
                    let quads = imgData.data;

                    for (let y = 0; y < height; y++) {
                        for (let x = 0; x < width; x++) {
                            let r = data.getU8();
                            let g = data.getU8();
                            let ix = y * width + x;

                            quads[ix * 4] = r;
                            quads[ix * 4 + 1] = g;
                            quads[ix * 4 + 2] = 255;
                            quads[ix * 4 + 3] = 255;
                        }
                    }

                    for (let y = 0; y < height; y++) {
                        for (let x = 0; x < width; x++) {
                            data.getU8();
                        }
                    }

                    let num_locations = data.getU8();

                    for (let n = 0; n < num_locations; n++) {
                        let x = data.getU16();
                        let y = data.getU16();
                        console.log("x: " + x + ", y: " + y);
                    }

                    console.log("Consumed map data. " + data.offset);

                    ctx.putImageData(imgData, 0, 0);

                    let img = new Image(width, height);
                    img.src = canvas.toDataURL();
                    img.onload = function (e: Event) {
                        game.tileDrawer.setTiles(img);
                        let mainMenu = document.getElementById('mainMenu');
                        mainMenu.appendChild(img);
                    };

                    break msg_switch;
                default:
                    console.log("No message of type " + msg_type + " exists.");
                    return;
            }
        }
    }
}