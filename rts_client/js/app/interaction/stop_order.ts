module Interaction.StopOrder {

    export class BeingIssued implements Interaction.Core.Control { }

    export function issue(game: Game) {
        let selected = Interaction.SelectingUnits.selectedUnitIDs(game);
        let input = game.inputState;

        game.chef.put8(Interaction.Core.ServerMessage.Stop);
        game.chef.putU32(game.orderID++);

        game.chef.put8(Interaction.Core.QueueOrder.Clear);

        for (let i = 0; i < selected.length; i++) {
            game.chef.putU16(selected[i]);
        }
        game.connection.send(game.chef.done());
    }
}