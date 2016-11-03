module Interaction.AttackMoveOrder {

    export class BeingIssued implements Interaction.Core.Control { }

    export function issue(game: Game) {
        let selected = Interaction.SelectingUnits.selectedUnitIDs(game);
        let input = game.inputState;
        let elem = input.element();

        game.chef.put8(3);
        if (input.shiftDown()) {
            game.chef.put8(1);
        }
        else {
            game.chef.put8(0);
        }

        game.chef.putF64((game.camera.x + (input.mouseX() - elem .offsetWidth / 2)) / Game.TILESIZE);
        game.chef.putF64((game.camera.y - (input.mouseY() - elem .offsetHeight / 2)) / Game.TILESIZE);

        for (let i = 0; i < selected.length; i++) {
            game.chef.put16(selected[i]);
        }
        game.connection.send(game.chef.done());
    }
}