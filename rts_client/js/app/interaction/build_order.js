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
            return BeingIssued;
        }());
        BuildOrder.BeingIssued = BeingIssued;
        function issue(game, build_type) {
            var selected = Interaction.SelectingUnits.selectedUnitIDs(game);
            var input = game.inputState;
            var elem = input.element();
            game.chef.put8(2);
            if (input.shiftDown()) {
                game.chef.put8(1);
            }
            else {
                game.chef.put8(0);
            }
            game.chef.put16(build_type);
            game.chef.putF64((game.camera.x + (input.mouseX() - elem.offsetWidth / 2)) / Game.TILESIZE);
            game.chef.putF64((game.camera.y - (input.mouseY() - elem.offsetHeight / 2)) / Game.TILESIZE);
            for (var i = 0; i < selected.length; i++) {
                game.chef.put16(selected[i]);
            }
            game.connection.send(game.chef.done());
        }
        BuildOrder.issue = issue;
    })(BuildOrder = Interaction.BuildOrder || (Interaction.BuildOrder = {}));
})(Interaction || (Interaction = {}));
//# sourceMappingURL=build_order.js.map