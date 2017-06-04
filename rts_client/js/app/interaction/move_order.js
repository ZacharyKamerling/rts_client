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
            var elem = game.inputState.element();
            game.chef.put8(Interaction.Core.ServerMessage.Move);
            game.chef.putU32(game.orderID++);
            if (input.shiftDown()) {
                game.chef.put8(Interaction.Core.QueueOrder.Append);
            }
            else {
                game.chef.put8(Interaction.Core.QueueOrder.Replace);
            }
            game.chef.putF64((game.camera.x + (input.mouseX() - elem.offsetWidth / 2)) / Game.TILESIZE);
            game.chef.putF64((game.camera.y - (input.mouseY() - elem.offsetHeight / 2)) / Game.TILESIZE);
            for (var i = 0; i < selected.length; i++) {
                game.chef.put16(selected[i]);
            }
            game.connection.send(game.chef.done());
        }
        MoveOrder.issue = issue;
    })(MoveOrder = Interaction.MoveOrder || (Interaction.MoveOrder = {}));
})(Interaction || (Interaction = {}));
//# sourceMappingURL=move_order.js.map