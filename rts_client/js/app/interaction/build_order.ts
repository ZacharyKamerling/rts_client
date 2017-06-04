﻿module Interaction.BuildOrder {

    export class BeingIssued implements Interaction.Core.Control {
        width: number;
        height: number;
        type: number;
        img: string;

        constructor(width: number, height: number, type: number, img: string) {
            this.width = width;
            this.height = height;
            this.type = type;
            this.img = img;
        }
    }

    export function issue(game: Game, build_type: number) {
        let selected = Interaction.SelectingUnits.selectedUnitIDs(game);
        let input = game.inputState;
        let elem = input.element();

        game.chef.put8(Interaction.Core.ServerMessage.Build);
        game.chef.putU32(game.orderID++);
        if (input.shiftDown()) {
            game.chef.put8(Interaction.Core.QueueOrder.Append);
        }
        else {
            game.chef.put8(Interaction.Core.QueueOrder.Replace);
        }

        game.chef.put16(build_type);
        game.chef.putF64((game.camera.x + (input.mouseX() - elem.offsetWidth / 2)) / Game.TILESIZE);
        game.chef.putF64((game.camera.y - (input.mouseY() - elem.offsetHeight / 2)) / Game.TILESIZE);

        for (let i = 0; i < selected.length; i++) {
            game.chef.put16(selected[i]);
        }
        game.connection.send(game.chef.done());
    }
}