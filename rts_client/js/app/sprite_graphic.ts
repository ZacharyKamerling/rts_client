class SpriteGraphic {
    facing: number;
    x_offset: number;
    y_offset: number;
    layer: number;
    img_ref: string;
    private rotation_rate: number;

    rotate(elapsed: number) {
        if (this.rotation_rate) {
            this.facing += this.rotation_rate * elapsed;

            while (this.facing > Math.PI * 2) {
                this.facing -= Math.PI * 2;
            }
        }
    }

    clone(): SpriteGraphic {
        let sg = new SpriteGraphic();
        sg.facing = this.facing;
        sg.x_offset = this.x_offset;
        sg.y_offset = this.y_offset;
        sg.layer = this.layer;
        sg.img_ref = this.img_ref;
        sg.rotation_rate = this.rotation_rate;

        return sg;
    }
}