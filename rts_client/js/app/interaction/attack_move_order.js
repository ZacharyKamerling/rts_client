var Interaction;
(function (Interaction) {
    var AttackMoveOrder;
    (function (AttackMoveOrder) {
        class BeingIssued {
        }
        AttackMoveOrder.BeingIssued = BeingIssued;
        function issue(game) {
            let selected = Interaction.SelectingUnits.selectedUnitIDs(game);
            let input = game.inputState;
            let width = game.unitDrawer.width();
            let height = game.unitDrawer.height();
            game.chef.putU8(Interaction.Core.ServerMessage.AttackMove);
            game.chef.putU32(game.orderID++);
            let xy = game.gameXY();
            game.chef.putF64(xy.x);
            game.chef.putF64(xy.y);
            if (input.shiftDown()) {
                game.chef.putU8(Interaction.Core.QueueOrder.Append);
            }
            else {
                game.chef.putU8(Interaction.Core.QueueOrder.Replace);
            }
            for (let i = 0; i < selected.length; i++) {
                game.chef.putU16(selected[i]);
            }
            game.connection.send(game.chef.done());
        }
        AttackMoveOrder.issue = issue;
    })(AttackMoveOrder = Interaction.AttackMoveOrder || (Interaction.AttackMoveOrder = {}));
})(Interaction || (Interaction = {}));
