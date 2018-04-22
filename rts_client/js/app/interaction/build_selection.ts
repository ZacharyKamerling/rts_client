module Interaction.BuildSelection {

    export class BeingIssued implements Interaction.Core.Control {
        constructor() {}
    }

    export function configureCommandCard(game: Game) {
        let bldSet: { [index: string]: void } = {};
        let blds: string[] = [];

        for (let i = 0; i < game.souls.length; i++) {
            let soul = game.souls[i];

            if (soul && soul.current.is_selected) {
                for (let bld of soul.current.build_roster) {
                    bldSet[bld] = null;
                }
            }
        }

        for (let bld in bldSet) {
            if (bldSet.hasOwnProperty(bld)) {
                blds.push("build_" + bld);
            }
        }

        blds.sort();
        game.commandPanel.renderCommands(blds);
    }
}