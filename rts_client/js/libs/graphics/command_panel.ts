class CommandPanel {
    private parent: HTMLElement;
    private handler: (name: string) => void;

    constructor(parent: HTMLElement, handler: (name: string) => void) {
        this.parent = parent;
        this.handler = handler;
    }

    renderCommands(cmds: { name: string, src: string }[]) {
        cmds = CommandPanel.uniq(cmds);

        while (this.parent.firstChild) {
            this.parent.removeChild(this.parent.firstChild);
        }

        for (let i = 0; i < cmds.length; i++) {
            let self = this;
            let cmd = cmds[i];
            let btn = document.createElement("input");
            btn.name = cmd.name;
            btn.type = "image";
            btn.src = cmd.src;
            btn.onclick = function (name: string, handler: (name: string) => void) {
                return function () {
                    handler(name);
                };
            }(btn.name, self.handler);
            let li = document.createElement("li");
            li.appendChild(btn);
            this.parent.appendChild(li);
        }
    }
}