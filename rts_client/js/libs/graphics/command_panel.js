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
            btn.src = this.commands[cmd].src;
            btn.onclick = function (name, handler) {
                return function () {
                    handler(name);
                };
            }(btn.name, self_1.handler);
            //let li = document.createElement("li");
            //li.appendChild(btn);
            this.parent.appendChild(btn);
        }
    };
    return CommandPanel;
})();
//# sourceMappingURL=command_panel.js.map