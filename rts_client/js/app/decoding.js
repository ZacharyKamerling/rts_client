var Decoding;
(function (Decoding) {
    var ClientMessage;
    (function (ClientMessage) {
        ClientMessage[ClientMessage["UnitMove"] = 0] = "UnitMove";
        ClientMessage[ClientMessage["UnitDeath"] = 1] = "UnitDeath";
        ClientMessage[ClientMessage["OrderCompleted"] = 2] = "OrderCompleted";
        ClientMessage[ClientMessage["MeleeSmack"] = 3] = "MeleeSmack";
        ClientMessage[ClientMessage["MissileMove"] = 4] = "MissileMove";
        ClientMessage[ClientMessage["MissileExplode"] = 5] = "MissileExplode";
        ClientMessage[ClientMessage["Construction"] = 6] = "Construction";
        ClientMessage[ClientMessage["TeamInfo"] = 7] = "TeamInfo";
        ClientMessage[ClientMessage["MapInfo"] = 8] = "MapInfo";
        ClientMessage[ClientMessage["UnitInfo"] = 9] = "UnitInfo";
    })(ClientMessage || (ClientMessage = {}));
    function processPacket(game, data) {
        let currentTime = Date.now();
        let logicFrame = data.getU32();
        if (logicFrame > game.logicFrame) {
            game.logicFrame = logicFrame;
            game.lastLogicFrameTime = currentTime;
            for (let i = 0; i < game.souls.length; i++) {
                let soul = game.souls[i];
                if (soul && (logicFrame - soul.new.frame_created > 2)) {
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
            msg_switch: switch (msg_type) {
                case ClientMessage.UnitMove:
                    Unit.decodeUnit(game, data, currentTime, logicFrame);
                    break msg_switch;
                case ClientMessage.MissileMove:
                case ClientMessage.MissileExplode:
                    let exploding = msg_type === ClientMessage.MissileExplode;
                    let new_misl = Missile.decodeMissile(data, currentTime, logicFrame, exploding);
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
                case ClientMessage.UnitDeath:
                    let unit_ID = data.getU16();
                    let dmg_type = data.getU8();
                    if (game.souls[unit_ID]) {
                        game.souls[unit_ID].current.is_dead = true;
                    }
                    break msg_switch;
                case ClientMessage.TeamInfo:
                    game.team = data.getU8();
                    game.maxPrime = data.getU32();
                    game.prime = data.getU32();
                    game.primeOutput = data.getF64();
                    game.primeDrain = data.getF64();
                    game.maxEnergy = data.getU32();
                    game.energy = data.getU32();
                    game.energyOutput = data.getF64();
                    game.energyDrain = data.getF64();
                    break msg_switch;
                case ClientMessage.Construction:
                    let builder = data.getU16();
                    let buildee = data.getU16();
                    break msg_switch;
                case ClientMessage.OrderCompleted:
                    let unitID = data.getU16();
                    let orderID = data.getU16();
                    break msg_switch;
                case ClientMessage.UnitInfo:
                    let json = data.getString();
                    let unit_proto = new Unit();
                    unit_proto.jsonConfig(json);
                    game.unitPrototypes.push(unit_proto.clone());
                    break msg_switch;
                case ClientMessage.MapInfo:
                    let team = data.getU8();
                    let width = data.getU16();
                    let height = data.getU16();
                    game.team = team;
                    game.mapWidth = width;
                    game.mapHeight = height;
                    let canvas = document.createElement('canvas');
                    let mmCanvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    mmCanvas.width = width;
                    mmCanvas.height = height;
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
                            quads[ix * 4 + 2] = 0;
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
                        if (n === team) {
                            game.camera.x = x * Game.TILESIZE;
                            game.camera.y = (height - y) * Game.TILESIZE;
                            console.log("Set Map X & Y: " + x + ":" + y);
                        }
                    }
                    let num_prime_nodes = data.getU32();
                    let prime_nodes = new Array();
                    for (let n = 0; n < num_prime_nodes; n++) {
                        let x = data.getU16();
                        let y = data.getU16();
                        prime_nodes.push({ x: (x + Game.PRIME_NODE_WIDTH / 2) * Game.TILESIZE, y: (height - y - Game.PRIME_NODE_WIDTH / 2) * Game.TILESIZE });
                        console.log("Node X & Y: " + x + ":" + y);
                    }
                    game.primeNodes = prime_nodes;
                    console.log("Consumed map data. " + data.offset);
                    ctx.putImageData(imgData, 0, 0);
                    let img = new Image(width, height);
                    img.src = canvas.toDataURL();
                    img.onload = function (e) {
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
    Decoding.processPacket = processPacket;
})(Decoding || (Decoding = {}));
