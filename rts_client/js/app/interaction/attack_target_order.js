var Interaction;
(function (Interaction) {
    var AttackTargetOrder;
    (function (AttackTargetOrder) {
        var BeingIssued = (function () {
            function BeingIssued() {
            }
            return BeingIssued;
        }());
        AttackTargetOrder.BeingIssued = BeingIssued;
        function issue(game, unitID) {
            var selected = Interaction.SelectingUnits.selectedUnitIDs(game);
            var input = game.inputState;
            game.chef.put8(Interaction.Core.ServerMessage.AttackTarget);
            game.chef.putU32(game.orderID++);
            game.chef.putU16(unitID);
            if (input.shiftDown()) {
                game.chef.put8(Interaction.Core.QueueOrder.Append);
            }
            else {
                game.chef.put8(Interaction.Core.QueueOrder.Replace);
            }
            for (var i = 0; i < selected.length; i++) {
                game.chef.put16(selected[i]);
            }
            game.connection.send(game.chef.done());
        }
        AttackTargetOrder.issue = issue;
    })(AttackTargetOrder = Interaction.AttackTargetOrder || (Interaction.AttackTargetOrder = {}));
})(Interaction || (Interaction = {}));
