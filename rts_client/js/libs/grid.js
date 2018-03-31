class Grid {
    constructor(w, h) {
        this.w = w;
        this.h = h;
        this.node_state = new Uint8Array(new ArrayBuffer(w * h));
        for (let i = 0; i < w * h; i++) {
            this.node_state[i] = 0;
        }
    }
    isOpen(x, y) {
        return this.inBounds(x, y) && this.node_state[this.w * y + x] === 0;
    }
    set(x, y, upd) {
        if (this.inBounds(x, y)) {
            this.node_state[this.w * y + x] = upd;
        }
    }
    inBounds(x, y) {
        return x >= 0 && y >= 0 && x < this.w && y < this.h;
    }
}
