var Interaction;
(function (Interaction) {
    var AttackMoveOrder;
    (function (AttackMoveOrder) {
        var BeingIssued = (function () {
            function BeingIssued() {
            }
            BeingIssued.prototype.triggeredWith = function () {
                return this.inputEvent;
            };
            return BeingIssued;
        })();
        AttackMoveOrder.BeingIssued = BeingIssued;
        function issue(game, parent, event) {
            var selected = Interaction.SelectingUnits.selectedUnitIDs(game);
            game.chef.put8(3);
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
        AttackMoveOrder.issue = issue;
    })(AttackMoveOrder = Interaction.AttackMoveOrder || (Interaction.AttackMoveOrder = {}));
})(Interaction || (Interaction = {}));
//# sourceMappingURL=attack_move_order.js.map