var Interaction;
(function (Interaction) {
    var BuildOrder;
    (function (BuildOrder) {
        class BeingIssued {
            constructor(width, height, type, imgs) {
                this.width = width;
                this.height = height;
                this.type = type;
                this.imgs = imgs;
            }
        }
        BuildOrder.BeingIssued = BeingIssued;
        function issue(game, build_type) {
            let selected = Interaction.SelectingUnits.selectedUnitIDs(game);
            let input = game.inputState;
            let width = game.unitDrawer.width();
            let height = game.unitDrawer.height();
            game.chef.put8(Interaction.Core.ServerMessage.Build);
            game.chef.putU32(game.orderID++);
            game.chef.putU16(build_type);
            let xy = game.gameXY();
            game.chef.putF64(xy.x);
            game.chef.putF64(xy.y);
            if (input.shiftDown()) {
                game.chef.put8(Interaction.Core.QueueOrder.Append);
            }
            else {
                game.chef.put8(Interaction.Core.QueueOrder.Replace);
            }
            for (let i = 0; i < selected.length; i++) {
                game.chef.putU16(selected[i]);
            }
            game.connection.send(game.chef.done());
        }
        BuildOrder.issue = issue;
    })(BuildOrder = Interaction.BuildOrder || (Interaction.BuildOrder = {}));
})(Interaction || (Interaction = {}));
