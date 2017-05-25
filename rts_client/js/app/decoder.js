var Decoding;
(function (Decoding) {
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
                if (misl_soul && (logicFrame - misl_soul.new.frameCreated > 2)) {
                    game.missileSouls[i] = null;
                }
            }
        }
        else if (logicFrame < game.logicFrame) {
            return;
        }
        while (!data.empty()) {
            var msg_type = data.getU8();
            msg_switch: switch (msg_type) {
                // Unit
                case 0:
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
                            var cur = new_unit.clone();
                            game.souls[new_unit.unit_ID] = { old: null, current: cur, new: new_unit };
                        }
                    }
                    break msg_switch;
                // Missile
                case 1:
                case 2:
                    var exploding = msg_type === 2;
                    var new_misl = Missile.decodeMissile(data, currentTime, logicFrame, exploding);
                    if (new_misl) {
                        var soul = game.missileSouls[new_misl.misl_ID];
                        if (soul) {
                            soul.old = soul.current.clone();
                            soul.new = new_misl;
                        }
                        else {
                            var cur_1 = new_misl.clone();
                            game.missileSouls[new_misl.misl_ID] = { old: null, current: cur_1, new: new_misl };
                        }
                    }
                    break msg_switch;
                // Unit death
                case 3:
                    var unit_ID = data.getU16();
                    var dmg_type = data.getU8();
                    game.souls[unit_ID] = null;
                    break msg_switch;
                // Player Info
                case 4:
                    game.team = data.getU8();
                    game.metal = data.getU32();
                    game.energy = data.getU32();
                    break msg_switch;
                default:
                    console.log("No message of type " + msg_type + " exists.");
                    return;
            }
        }
    }
    Decoding.processPacket = processPacket;
})(Decoding || (Decoding = {}));
//# sourceMappingURL=decoder.js.map