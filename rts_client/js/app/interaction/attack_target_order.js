var Interaction;
(function (Interaction) {
    var AttackTargetOrder;
    (function (AttackTargetOrder) {
        class BeingIssued {
        }
        AttackTargetOrder.BeingIssued = BeingIssued;
        function issue(game, unitID) {
            let selected = Interaction.SelectingUnits.selectedUnitIDs(game);
            let input = game.inputState;
            game.chef.put8(Interaction.Core.ServerMessage.AttackTarget);
            game.chef.putU32(game.orderID++);
            game.chef.putU16(unitID);
            if (input.shiftDown()) {
                game.chef.put8(Interaction.Core.QueueOrder.Append);
            }
            else {
                game.chef.put8(Interaction.Core.QueueOrder.Replace);
            }
            for (let i = 0; i < selected.length; i++) {
                game.chef.put16(selected[i]);
            }
            game.connection.send(game.chef.done());
        }
        AttackTargetOrder.issue = issue;
    })(AttackTargetOrder = Interaction.AttackTargetOrder || (Interaction.AttackTargetOrder = {}));
})(Interaction || (Interaction = {}));
