var TeamColor = (function () {
    function TeamColor() {
    }
    TeamColor.prototype.clone = function () {
        var tc = new TeamColor();
        tc.name = this.name;
        tc.red = this.red;
        tc.green = this.green;
        tc.blue = this.blue;
        return tc;
    };
    return TeamColor;
}());
