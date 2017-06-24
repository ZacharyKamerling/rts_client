var Grid = (function () {
    function Grid(w, h) {
        this.w = w;
        this.h = h;
        this.node_state = new Uint8Array(new ArrayBuffer(w * h));
        for (var i = 0; i < w * h; i++) {
            this.node_state[i] = 0;
        }
    }
    Grid.prototype.isOpen = function (x, y) {
        return this.inBounds(x, y) && this.node_state[this.w * y + x] === 0;
    };
    Grid.prototype.set = function (x, y, upd) {
        if (this.inBounds(x, y)) {
            this.node_state[this.w * y + x] = upd;
        }
    };
    Grid.prototype.inBounds = function (x, y) {
        return x >= 0 && y >= 0 && x < this.w && y < this.h;
    };
    return Grid;
}());
