module Interaction.TrainOrder {

    export class BeingIssued implements Interaction.Core.Control { }

    export function issue(game: Game, proto: Unit) {
        let selected = Interaction.SelectingUnits.selectedUnitIDs(game);
        let input = game.inputState;

        game.chef.put8(Interaction.Core.ServerMessage.Train);
        game.chef.putU32(game.orderID++);
        game.chef.putU16(proto.type_id);

        if (input.shiftDown()) {
            game.chef.putU8(1 /* repeat */);
        }
        else {
            game.chef.putU8(0 /* no-repeat */);
        }

        if (input.ctrlDown()) {
            game.chef.putU8(Interaction.Core.QueueOrder.Prepend);
        }
        else {
            game.chef.putU8(Interaction.Core.QueueOrder.Append);
        }

        for (let i = 0; i < selected.length; i++) {
            if (game.unitPrototypes[i].train_roster.includes(proto.name)) {
                game.chef.put16(selected[i]);
            }
        }
        game.connection.send(game.chef.done());
    }
}