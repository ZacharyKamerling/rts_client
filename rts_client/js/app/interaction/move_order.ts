﻿module Interaction.MoveOrder {

    export class BeingIssued implements Interaction.Core.Control { }

    export function issue(game: Game) {
        let selected = Interaction.SelectingUnits.selectedUnitIDs(game);
        let input = game.inputState;
        let elem = game.inputState.element();

        game.chef.put8(Interaction.Core.ServerMessage.Move);
        game.chef.putU32(game.orderID++);
        if (input.shiftDown()) {
            game.chef.put8(Interaction.Core.QueueOrder.Append);
        }
        else {
            game.chef.put8(Interaction.Core.QueueOrder.Replace);
        }

        game.chef.putF64((game.camera.x + (input.mouseX() - elem.offsetWidth / 2)) / Game.TILESIZE);
        game.chef.putF64((game.camera.y - (input.mouseY() - elem.offsetHeight / 2)) / Game.TILESIZE);

        for (let i = 0; i < selected.length; i++) {
            game.chef.put16(selected[i]);
        }
        game.connection.send(game.chef.done());
    }
}