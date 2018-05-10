var Interaction;
(function (Interaction) {
    var TrainOrder;
    (function (TrainOrder) {
        class BeingIssued {
        }
        TrainOrder.BeingIssued = BeingIssued;
        function issue(game, proto) {
            let selected = Interaction.SelectingUnits.selectedUnitIDs(game);
            let input = game.inputState;
            game.chef.put8(Interaction.Core.ServerMessage.Train);
            game.chef.putU32(game.orderID++);
            game.chef.putU16(proto.type_id);
            if (input.shiftDown()) {
                game.chef.putU8(1);
            }
            else {
                game.chef.putU8(0);
            }
            if (input.ctrlDown()) {
                game.chef.putU8(Interaction.Core.QueueOrder.Prepend);
            }
            else {
                game.chef.putU8(Interaction.Core.QueueOrder.Append);
            }
            for (let i = 0; i < selected.length; i++) {
                if (game.unitPrototypes[i].train_roster.includes(proto.name)) {
                    game.chef.put16(selected[i]);
                }
            }
            game.connection.send(game.chef.done());
        }
        TrainOrder.issue = issue;
    })(TrainOrder = Interaction.TrainOrder || (Interaction.TrainOrder = {}));
})(Interaction || (Interaction = {}));
