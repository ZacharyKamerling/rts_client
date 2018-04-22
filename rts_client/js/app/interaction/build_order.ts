module Interaction.BuildOrder {

    export class BeingIssued implements Interaction.Core.Control {
        width: number;
        height: number;
        type: number;
        imgs: string[];

        constructor(width: number, height: number, type: number, imgs: string[]) {
            this.width = width;
            this.height = height;
            this.type = type;
            this.imgs = imgs;
        }
    }

    export function issue(game: Game, build_type: number) {
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
}