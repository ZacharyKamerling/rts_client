var Decoding;
(function (Decoding) {
    var ClientMessage;
    (function (ClientMessage) {
        ClientMessage[ClientMessage["UnitMove"] = 0] = "UnitMove";
        ClientMessage[ClientMessage["UnitDeath"] = 1] = "UnitDeath";
        ClientMessage[ClientMessage["OrderCompleted"] = 2] = "OrderCompleted";
        ClientMessage[ClientMessage["MissileMove"] = 3] = "MissileMove";
        ClientMessage[ClientMessage["MissileExplode"] = 4] = "MissileExplode";
        ClientMessage[ClientMessage["TeamInfo"] = 5] = "TeamInfo";
        ClientMessage[ClientMessage["MapInfo"] = 6] = "MapInfo";
    })(ClientMessage || (ClientMessage = {}));
    function processPacket(game, data) {
        var currentTime = Date.now();
        var logicFrame = data.getU32();
        if (logicFrame > game.logicFrame) {
            game.logicFrame = logicFrame;
            game.lastLogicFrameTime = currentTime;
            for (var i = 0; i < game.souls.length; i++) {
                var soul = game.souls[i];
                if (soul && (logicFrame - soul.new.frameCreated > 2)) {
                    game.souls[i] = null;
                }
            }
            for (var i = 0; i < game.missileSouls.length; i++) {
                var misl_soul = game.missileSouls[i];
                if (misl_soul && (logicFrame - misl_soul.new.frameCreated > 1)) {
                    game.missileSouls[i] = null;
                }
            }
        }
        else if (logicFrame < game.logicFrame) {
            return;
        }
        var _loop_1 = function() {
            var msg_type = data.getU8();
            msg_switch: switch (msg_type) {
                // Unit
                case ClientMessage.UnitMove:
                    var new_unit = Unit.decodeUnit(data, currentTime, logicFrame);
                    // If unit_soul exists, update it with new_unit
                    if (new_unit) {
                        var soul = game.souls[new_unit.unit_ID];
                        if (soul) {
                            soul.old = soul.current.clone();
                            soul.old.timeCreated = soul.new.timeCreated;
                            soul.new = new_unit;
                        }
                        else {
                            cur = new_unit.clone();
                            game.souls[new_unit.unit_ID] = { old: null, current: cur, new: new_unit };
                        }
                    }
                    break msg_switch;
                // Missile
                case ClientMessage.MissileMove:
                case ClientMessage.MissileExplode:
                    var exploding = msg_type === ClientMessage.MissileExplode;
                    var new_misl = Missile.decodeMissile(data, currentTime, logicFrame, exploding);
                    if (new_misl) {
                        var soul = game.missileSouls[new_misl.misl_ID];
                        if (soul) {
                            soul.old = soul.current.clone();
                            soul.old.timeCreated = soul.new.frameCreated;
                            soul.new = new_misl;
                        }
                        else {
                            var cur_1 = new_misl.clone();
                            game.missileSouls[new_misl.misl_ID] = { old: null, current: cur_1, new: new_misl };
                        }
                    }
                    break msg_switch;
                // Unit death
                case ClientMessage.UnitDeath:
                    var unit_ID = data.getU16();
                    var dmg_type = data.getU8();
                    game.souls[unit_ID].current.isDead = true;
                    break msg_switch;
                // Player Info
                case ClientMessage.TeamInfo:
                    game.team = data.getU8();
                    game.metal = data.getU32();
                    game.energy = data.getU32();
                    break msg_switch;
                default:
                    console.log("No message of type " + msg_type + " exists.");
                    return { value: void 0 };
                case ClientMessage.MapInfo:
                    var width = data.getU16();
                    var height = data.getU16();
                    var canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    var ctx = canvas.getContext('2d');
                    var imgData = ctx.getImageData(0, 0, width, height);
                    var quads = imgData.data;
                    for (var y = 0; y < height; y++) {
                        for (var x = 0; x < width; x++) {
                            var r = data.getU8();
                            var g = data.getU8();
                            var ix = y * width + x;
                            quads[ix * 4] = r;
                            quads[ix * 4 + 1] = g;
                        }
                    }
                    ctx.putImageData(imgData, 0, 0);
                    var img_1 = new Image(4096, 4096);
                    img_1.src = canvas.toDataURL();
                    img_1.onload = function (e) {
                        game.tileDrawer.setTiles(img_1);
                    };
            }
        };
        var cur;
        while (!data.empty()) {
            var state_1 = _loop_1();
            if (typeof state_1 === "object") return state_1.value;
        }
    }
    Decoding.processPacket = processPacket;
})(Decoding || (Decoding = {}));
//# sourceMappingURL=decoding.js.map