var CommandPanel = (function () {
    function CommandPanel(parent, commands, handler) {
        this.parent = parent;
        this.commands = commands;
        this.handler = handler;
    }
    CommandPanel.prototype.renderCommands = function (cmds) {
        while (this.parent.firstChild) {
            this.parent.removeChild(this.parent.firstChild);
        }
        for (var i = 0; i < cmds.length; i++) {
            var self_1 = this;
            var cmd = cmds[i];
            var btn = document.createElement("input");
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
            }(btn.name, self_1.handler);
            this.parent.appendChild(btn);
        }
    };
    return CommandPanel;
}());
