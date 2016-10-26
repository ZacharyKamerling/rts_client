module Interaction.SelectingUnits {
    export class CurrentAction implements Interaction.Core.Control {
        clickX: number;
        clickY: number;
        currentX: number;
        currentY: number;
        shiftDown: boolean;

        constructor(mx: number, my: number, cx: number, cy: number, sd: boolean) {
            this.clickX = mx;
            this.clickY = my;
            this.currentX = cx;
            this.currentY = cy;
            this.shiftDown = sd;
        }
    }

    export function selectedUnitIDs(game: Game): Array < number > {
        let selected: number[] = new Array();

        for(let i = 0; i < game.souls.length; i++) {
            let soul = game.souls[i];

            if (soul && soul.current.isSelected) {
                selected.push(i);
            }
        }

        return selected;
    }

    export function selectUnits(game: Game) {
        let control = game.control;
        if (control instanceof Interaction.SelectingUnits.CurrentAction) {
            for (let i = 0; i < game.souls.length; i++) {
                let soul = game.souls[i];

                if (soul) {
                    if (soul.current.team === game.team && soul.current.isBeingSelected) {
                        soul.current.isSelected = true;
                    }
                    else if (!control.shiftDown) {
                        soul.current.isSelected = false;
                    }
                }
            }
        }

        // Configure command card
        let cmdSet: { [index: string]: void } = {};
        let bldSet: { [index: string]: void } = {};
        for (let i = 0; i < game.souls.length; i++) {
            let soul = game.souls[i];

            if (soul && soul.current.isSelected) {
                soul.current.buildables(bldSet);
                soul.current.commands(cmdSet);
            }
        }

        let cmds: string[] = [];
        for (let cmd in cmdSet) {
            if (cmdSet.hasOwnProperty(cmd)) {
                cmds.push(cmd);
            }
        }

        let blds: string[] = [];
        for (let bld in bldSet) {
            if (bldSet.hasOwnProperty(bld)) {
                blds.push(bld);
            }
        }

        cmds.sort();
        blds.sort();

        game.commandPanel.renderCommands(cmds.concat(blds));
    }

    export function configUnitSelections(game: Game) {
        let control = game.control;
        if (control instanceof Interaction.SelectingUnits.CurrentAction) {
            configureUnitsBeingSelected(game, control.shiftDown, control.clickX, control.clickY, control.currentX, control.currentY);
        }
        if (control instanceof Interaction.Core.DoingNothing) {

        }
    }

    function configureUnitsBeingSelected(game: Game, shiftDown: boolean, x1: number, y1: number, x2: number, y2: number) {
        let minX = Math.min(x1, x2);
        let minY = Math.min(y1, y2);
        let maxX = Math.max(x1, x2);
        let maxY = Math.max(y1, y2);

        for (let i = 0; i < game.souls.length; i++) {
            let soul = game.souls[i];

            if (soul && soul.new && soul.new.team === game.team) {
                let x = soul.current.x;
                let y = soul.current.y;
                let r = soul.current.getRadius() * Game.TILESIZE;
                let rSqrd = r * r;

                let nDif = y - maxY;
                let sDif = y - minY;
                let eDif = x - maxX;
                let wDif = x - minX;

                if (y >= minY && y <= maxY) {
                    if (x + r >= minX && x - r <= maxX) {
                        soul.current.isBeingSelected = true;
                    }
                    else if (!shiftDown) {
                        soul.current.isBeingSelected = false;
                    }
                }
                else if (x >= minX && x <= maxX) {
                    if (y + r >= minY && y - r <= maxY) {
                        soul.current.isBeingSelected = true;
                    }
                    else if (!shiftDown) {
                        soul.current.isBeingSelected = false;
                    }
                }
                else if (x > maxX) {
                    // Northeast
                    if (y > maxY && (nDif * nDif + eDif * eDif) <= rSqrd) {
                        soul.current.isBeingSelected = true;
                    }
                    // Southeast
                    else if (y < minY && (sDif * sDif + eDif * eDif) <= rSqrd) {
                        soul.current.isBeingSelected = true;
                    }
                    else if (!shiftDown) {
                        soul.current.isBeingSelected = false;
                    }
                }
                else if (x < minX) {
                    // Northwest
                    if (y > maxY && (nDif * nDif + wDif * wDif) <= rSqrd) {
                        soul.current.isBeingSelected = true;
                    }
                    // Southwest
                    else if (y < minY && (sDif * sDif + wDif * wDif) <= rSqrd) {
                        soul.current.isBeingSelected = true;
                    }
                    else if (!shiftDown) {
                        soul.current.isBeingSelected = false;
                    }
                }
                else if (!shiftDown) {
                    soul.current.isBeingSelected = false;
                }
            }
        }
    }

    export function begin(game: Game, parent: HTMLElement, event: MousePress) {
        let x = game.camera.x + event.x - parent.offsetWidth / 2;
        let y = game.camera.y - (event.y - parent.offsetHeight / 2);
        game.control = new Interaction.SelectingUnits.CurrentAction(x, y, x, y, event.shiftDown);

        if (!event.shiftDown) {
            for (let i = 0; i < game.souls.length; i++) {
                let soul = game.souls[i];

                if (soul) {
                    soul.current.isSelected = false;
                }
            }
        }
    }
}