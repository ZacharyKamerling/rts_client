class Grid {
    private node_state: Uint8Array;
    private w: number;
    private h: number;

    constructor(w: number, h: number) {
        this.w = w;
        this.h = h;

        this.node_state = new Uint8Array(new ArrayBuffer(w * h));

        for (let i = 0; i < w * h; i++) {
            this.node_state[i] = 0;
        }
    }

    isOpen(x: number, y: number) {
        return this.inBounds(x, y) && this.node_state[this.w * y + x] === 0;
    }

    set(x: number, y: number, upd: number) {
        if (this.inBounds(x, y)) {
            this.node_state[this.w * y + x] = upd;
        }
    }

    private inBounds(x: number, y: number) {
        return x >= 0 && y >= 0 && x < this.w && y < this.h;
    }
}