var Interaction;
(function (Interaction) {
    var AssistOrder;
    (function (AssistOrder) {
        class BeingIssued {
        }
        AssistOrder.BeingIssued = BeingIssued;
        function issue(game, unitID) {
            let selected = Interaction.SelectingUnits.selectedUnitIDs(game);
            let input = game.inputState;
            game.chef.put8(Interaction.Core.ServerMessage.Assist);
            game.chef.putU32(game.orderID++);
            game.chef.putU16(unitID);
            if (input.shiftDown()) {
                game.chef.put8(Interaction.Core.QueueOrder.Append);
            }
            else {
                game.chef.put8(Interaction.Core.QueueOrder.Replace);
            }
            for (let i = 0; i < selected.length; i++) {
                if (selected[i] !== unitID) {
                    game.chef.put16(selected[i]);
                }
            }
            game.connection.send(game.chef.done());
        }
        AssistOrder.issue = issue;
    })(AssistOrder = Interaction.AssistOrder || (Interaction.AssistOrder = {}));
})(Interaction || (Interaction = {}));
