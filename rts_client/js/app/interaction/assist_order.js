var Interaction;
(function (Interaction) {
    var AssistOrder;
    (function (AssistOrder) {
        var BeingIssued = (function () {
            function BeingIssued() {
            }
            return BeingIssued;
        }());
        AssistOrder.BeingIssued = BeingIssued;
        function issue(game, unitID) {
            var selected = Interaction.SelectingUnits.selectedUnitIDs(game);
            var input = game.inputState;
            game.chef.put8(Interaction.Core.ServerMessage.Assist);
            game.chef.putU32(game.orderID++);
            game.chef.putU16(unitID);
            if (input.shiftDown()) {
                game.chef.put8(Interaction.Core.QueueOrder.Append);
            }
            else {
                game.chef.put8(Interaction.Core.QueueOrder.Replace);
            }
            for (var i = 0; i < selected.length; i++) {
                if (game.souls[selected[i]].new.unit_ID !== unitID) {
                    game.chef.put16(selected[i]);
                }
            }
            game.connection.send(game.chef.done());
        }
        AssistOrder.issue = issue;
    })(AssistOrder = Interaction.AssistOrder || (Interaction.AssistOrder = {}));
})(Interaction || (Interaction = {}));
