class CommandPanel {
    private parent: HTMLElement;
    private handler: (name: string) => void;
    private commands: { [index: string]: {src: string, tooltip: string} };

    constructor(parent: HTMLElement, handler: (name: string) => void) {
        this.parent = parent;
        this.handler = handler;
        this.commands = {};
    }

    addCommand(ref: string, command: { src: string, tooltip: string }) {
        console.log("Added " + ref + " with src: " + command.src + " and tooltip: " + command.tooltip);
        this.commands[ref] = command;
    }

    renderCommands(cmds: string[]) {
        while (this.parent.firstChild) {
            this.parent.removeChild(this.parent.firstChild);
        }

        let self = this;
        for (let cmdRef of cmds) {
            let cmd = this.commands[cmdRef];
            if (cmd) {
                let btn = document.createElement("input");
                btn.name = cmdRef;
                btn.type = "image";
                btn.title = cmd.tooltip;
                btn.src = cmd.src;
                btn.onclick = function (name: string, handler: (name: string) => void) {
                    return function (event: MouseEvent) {
                        event.stopPropagation();
                        event.stopImmediatePropagation();
                        handler(name);
                    };
                } (btn.name, self.handler);
                this.parent.appendChild(btn);
            }
            else {
                console.log("Couldn't render " + cmdRef);
            }
        }
    }
}