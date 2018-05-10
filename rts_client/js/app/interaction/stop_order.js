var Interaction;
(function (Interaction) {
    var StopOrder;
    (function (StopOrder) {
        class BeingIssued {
        }
        StopOrder.BeingIssued = BeingIssued;
        function issue(game) {
            let selected = Interaction.SelectingUnits.selectedUnitIDs(game);
            let input = game.inputState;
            game.chef.put8(Interaction.Core.ServerMessage.Stop);
            game.chef.putU32(game.orderID++);
            game.chef.put8(Interaction.Core.QueueOrder.Clear);
            for (let i = 0; i < selected.length; i++) {
                game.chef.putU16(selected[i]);
            }
            game.connection.send(game.chef.done());
        }
        StopOrder.issue = issue;
    })(StopOrder = Interaction.StopOrder || (Interaction.StopOrder = {}));
})(Interaction || (Interaction = {}));
