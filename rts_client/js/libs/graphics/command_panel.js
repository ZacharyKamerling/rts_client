var CommandPanel = (function () {
    function CommandPanel(parent, handler) {
        this.parent = parent;
        this.handler = handler;
    }
    CommandPanel.prototype.renderCommands = function (cmds) {
        cmds = CommandPanel.uniq(cmds);
        while (this.parent.firstChild) {
            this.parent.removeChild(this.parent.firstChild);
        }
        for (var i = 0; i < cmds.length; i++) {
            var self_1 = this;
            var cmd = cmds[i];
            var btn = document.createElement("input");
            btn.name = cmd.name;
            btn.type = "image";
            btn.src = cmd.src;
            btn.onclick = function (name, handler) {
                return function () {
                    handler(name);
                };
            }(btn.name, self_1.handler);
            var li = document.createElement("li");
            li.appendChild(btn);
            this.parent.appendChild(li);
        }
    };
    return CommandPanel;
})();
//# sourceMappingURL=command_panel.js.map