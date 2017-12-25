class CommandPanel {
    constructor(parent, commands, handler) {
        this.parent = parent;
        this.commands = commands;
        this.handler = handler;
    }
    renderCommands(cmds) {
        while (this.parent.firstChild) {
            this.parent.removeChild(this.parent.firstChild);
        }
        for (let i = 0; i < cmds.length; i++) {
            let self = this;
            let cmd = cmds[i];
            let btn = document.createElement("input");
            btn.name = cmd;
            btn.type = "image";
            btn.title = this.commands[cmd].tooltip;
            btn.src = this.commands[cmd].src;
            btn.onclick = function (name, handler) {
                return function (event) {
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    handler(name);
                };
            }(btn.name, self.handler);
            this.parent.appendChild(btn);
        }
    }
}
