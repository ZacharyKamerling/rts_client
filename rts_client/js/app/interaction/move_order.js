var Interaction;
(function (Interaction) {
    var MoveOrder;
    (function (MoveOrder) {
        var BeingIssued = (function () {
            function BeingIssued() {
            }
            return BeingIssued;
        })();
        MoveOrder.BeingIssued = BeingIssued;
        function issue(game, parent, event) {
            var selected = Interaction.SelectingUnits.selectedUnitIDs(game);
            game.chef.put8(0);
            if (event.shiftDown) {
                game.chef.put8(1);
            }
            else {
                game.chef.put8(0);
            }
            game.chef.putF64((game.camera.x + (event.x - parent.offsetWidth / 2)) / Game.TILESIZE);
            game.chef.putF64((game.camera.y - (event.y - parent.offsetHeight / 2)) / Game.TILESIZE);
            for (var i = 0; i < selected.length; i++) {
                game.chef.put16(selected[i]);
            }
            game.connection.send(game.chef.done());
        }
        MoveOrder.issue = issue;
    })(MoveOrder = Interaction.MoveOrder || (Interaction.MoveOrder = {}));
})(Interaction || (Interaction = {}));
//# sourceMappingURL=move_order.js.map