var Interaction;
(function (Interaction) {
    var BuildOrder;
    (function (BuildOrder) {
        var BeingIssued = (function () {
            function BeingIssued(width, height, type, imgs) {
                this.width = width;
                this.height = height;
                this.type = type;
                this.imgs = imgs;
            }
            return BeingIssued;
        }());
        BuildOrder.BeingIssued = BeingIssued;
        function issue(game, build_type) {
            var selected = Interaction.SelectingUnits.selectedUnitIDs(game);
            var input = game.inputState;
            var width = game.unitDrawer.width();
            var height = game.unitDrawer.height();
            game.chef.put8(Interaction.Core.ServerMessage.Build);
            game.chef.putU32(game.orderID++);
            game.chef.put16(build_type);
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
        BuildOrder.issue = issue;
    })(BuildOrder = Interaction.BuildOrder || (Interaction.BuildOrder = {}));
})(Interaction || (Interaction = {}));
