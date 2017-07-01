module Interaction.AttackTargetOrder {

    export class BeingIssued implements Interaction.Core.Control { }

    export function issue(game: Game, unitID: number) {
        let selected = Interaction.SelectingUnits.selectedUnitIDs(game);
        let input = game.inputState;

        game.chef.put8(Interaction.Core.ServerMessage.AttackTarget);
        game.chef.putU32(game.orderID++);

        game.chef.putU16(unitID);

        if (input.shiftDown()) {
            game.chef.put8(Interaction.Core.QueueOrder.Append);
        }
        else {
            game.chef.put8(Interaction.Core.QueueOrder.Replace);
        }

        for (let i = 0; i < selected.length; i++) {
            game.chef.put16(selected[i]);
        }
        game.connection.send(game.chef.done());
    }
}