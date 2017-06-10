var Interaction;
(function (Interaction) {
    var MoveOrder;
    (function (MoveOrder) {
        var BeingIssued = (function () {
            function BeingIssued() {
            }
            return BeingIssued;
        }());
        MoveOrder.BeingIssued = BeingIssued;
        function issue(game) {
            var selected = Interaction.SelectingUnits.selectedUnitIDs(game);
            var input = game.inputState;
            var width = game.unitDrawer.width();
            var height = game.unitDrawer.height();
            game.chef.put8(Interaction.Core.ServerMessage.Move);
            game.chef.putU32(game.orderID++);
            game.chef.putF64((game.camera.x + (input.mouseX() - width / 2)) / Game.TILESIZE);
            game.chef.putF64((game.camera.y - (input.mouseY() - height / 2)) / Game.TILESIZE);
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
        MoveOrder.issue = issue;
    })(MoveOrder = Interaction.MoveOrder || (Interaction.MoveOrder = {}));
})(Interaction || (Interaction = {}));
//# sourceMappingURL=move_order.js.map