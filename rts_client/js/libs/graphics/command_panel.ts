﻿class CommandPanel {
    private parent: HTMLElement;
    private handler: (name: string) => void;
    private commands: { [index: string]: {src: string, tooltip: string} };

    constructor(parent: HTMLElement, commands: { [index: string]: { src: string, tooltip: string } }, handler: (name: string) => void) {
        this.parent = parent;
        this.commands = commands;
        this.handler = handler;
    }

    renderCommands(cmds: string[]) {
        while (this.parent.firstChild) {
            this.parent.removeChild(this.parent.firstChild);
        }

        for (let i = 0; i < cmds.length; i++) {
            let self = this;
            let cmd = cmds[i];
            let btn = document.createElement("input");
            btn.name = cmd;
            btn.type = "image";
            btn.src = this.commands[cmd].src;
            btn.onclick = function (name: string, handler: (name: string) => void) {
                return function () {
                    handler(name);
                };
            }(btn.name, self.handler);
            //let li = document.createElement("li");
            //li.appendChild(btn);
            this.parent.appendChild(btn);
        }
    }
}