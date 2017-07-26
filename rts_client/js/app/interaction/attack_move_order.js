var Interaction;
(function (Interaction) {
    var AttackMoveOrder;
    (function (AttackMoveOrder) {
        var BeingIssued = (function () {
            function BeingIssued() {
            }
            return BeingIssued;
        }());
        AttackMoveOrder.BeingIssued = BeingIssued;
        function issue(game) {
            var selected = Interaction.SelectingUnits.selectedUnitIDs(game);
            var input = game.inputState;
            var width = game.unitDrawer.width();
            var height = game.unitDrawer.height();
            game.chef.put8(Interaction.Core.ServerMessage.AttackMove);
            game.chef.putU32(game.orderID++);
            var xy = game.gameXY();
            game.chef.putF64(xy.x);
            game.chef.putF64(xy.y);
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
        AttackMoveOrder.issue = issue;
    })(AttackMoveOrder = Interaction.AttackMoveOrder || (Interaction.AttackMoveOrder = {}));
})(Interaction || (Interaction = {}));
