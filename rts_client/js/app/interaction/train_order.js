var Interaction;
(function (Interaction) {
    var TrainOrder;
    (function (TrainOrder) {
        class Training {
            clone() {
                let a = new Training();
                a.orderID = this.orderID;
                a.repeat = this.repeat;
                a.unitTypeID = this.unitTypeID;
                return a;
            }
        }
        TrainOrder.Training = Training;
        function issue(game, proto) {
            let selected = Interaction.SelectingUnits.selectedUnitIDs(game);
            let input = game.inputState;
            let repeat = input.shiftDown();
            let order = input.ctrlDown();
            let orderID = game.orderID++;
            game.chef.put8(Interaction.Core.ServerMessage.Train);
            game.chef.putU32(orderID);
            game.chef.putU16(proto.type_id);
            if (repeat) {
                game.chef.putU8(1);
            }
            else {
                game.chef.putU8(0);
            }
            if (order) {
                game.chef.putU8(Interaction.Core.QueueOrder.Prepend);
            }
            else {
                game.chef.putU8(Interaction.Core.QueueOrder.Append);
            }
            let training = new Training();
            training.orderID = orderID;
            training.repeat = repeat;
            training.unitTypeID = proto.type_id;
            for (let i = 0; i < selected.length; i++) {
                if (game.souls[selected[i]].current.train_roster.includes(proto.name)) {
                    game.chef.put16(selected[i]);
                    let queue = game.souls[selected[i]].current.train_queue;
                    if (order) {
                        queue = [training].concat(queue);
                    }
                    else {
                        queue.push(training);
                    }
                }
            }
            game.connection.send(game.chef.done());
        }
        TrainOrder.issue = issue;
    })(TrainOrder = Interaction.TrainOrder || (Interaction.TrainOrder = {}));
})(Interaction || (Interaction = {}));
