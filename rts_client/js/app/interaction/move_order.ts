module Interaction.MoveOrder {

    export class BeingIssued implements Interaction.Core.Control { }

    export function issue(game: Game, parent: HTMLElement, event: MousePress) {
        let selected = Interaction.SelectingUnits.selectedUnitIDs(game);

        game.chef.put8(0);
        if (event.shiftDown) {
            game.chef.put8(1);
        }
        else {
            game.chef.put8(0);
        }

        game.chef.putF64((game.camera.x + (event.x - parent.offsetWidth / 2)) / Game.TILESIZE);
        game.chef.putF64((game.camera.y - (event.y - parent.offsetHeight / 2)) / Game.TILESIZE);

        for (let i = 0; i < selected.length; i++) {
            game.chef.put16(selected[i]);
        }
        game.connection.send(game.chef.done());
    }
}