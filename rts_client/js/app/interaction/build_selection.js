var Interaction;
(function (Interaction) {
    var BuildSelection;
    (function (BuildSelection) {
        class BeingIssued {
            constructor() {
            }
        }
        BuildSelection.BeingIssued = BeingIssued;
        function configureCommandCard(game) {
            let bldSet = {};
            let blds = [];
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
            console.log(blds);
        }
        BuildSelection.configureCommandCard = configureCommandCard;
    })(BuildSelection = Interaction.BuildSelection || (Interaction.BuildSelection = {}));
})(Interaction || (Interaction = {}));
