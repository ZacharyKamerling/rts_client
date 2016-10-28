var Interaction;
(function (Interaction) {
    var BuildOrder;
    (function (BuildOrder) {
        var BeingIssued = (function () {
            function BeingIssued(width, height, type, img) {
                this.width = width;
                this.height = height;
                this.type = type;
                this.img = img;
            }
            BeingIssued.prototype.triggeredWith = function () {
                return this.inputEvent;
            };
            return BeingIssued;
        }());
        BuildOrder.BeingIssued = BeingIssued;
        function issue(game, parent, event, build_type) {
            var selected = Interaction.SelectingUnits.selectedUnitIDs(game);
            game.chef.put8(2);
            if (event.shiftDown) {
                game.chef.put8(1);
            }
            else {
                game.chef.put8(0);
            }
            game.chef.put16(build_type);
            game.chef.putF64((game.camera.x + (event.x - parent.offsetWidth / 2)) / Game.TILESIZE);
            game.chef.putF64((game.camera.y - (event.y - parent.offsetHeight / 2)) / Game.TILESIZE);
            for (var i = 0; i < selected.length; i++) {
                game.chef.put16(selected[i]);
            }
            game.connection.send(game.chef.done());
        }
        BuildOrder.issue = issue;
    })(BuildOrder = Interaction.BuildOrder || (Interaction.BuildOrder = {}));
})(Interaction || (Interaction = {}));
//# sourceMappingURL=build_order.js.map