class SpriteMap {
    public static WIDTH = 4096;
    public static HEIGHT = 4096;
    public onload: (e: Event) => any;
    public spriteSheet: HTMLImageElement;
    private map: { [index: string]: { x: number, y: number, w: number, h: number } } = {};

    constructor(stuff: { src: string, ref: string }[]) {
        let spriteSheet = document.createElement('canvas');
        spriteSheet.width = 4096;
        spriteSheet.height = 4096;
        let that = this;
        let x = 0;
        let y = 0;
        let max_h = 0;
        let count = 0;
        let imgs: HTMLImageElement[] = Array();

        for (let i = 0; i < stuff.length; i++) {
            let sprite = stuff[i];
            let img = document.createElement('img');
            imgs.push(img);
            img.src = sprite.src;
            img.onload = function () {
                return function (event: Event) {
                    count++;
                    if (count == stuff.length) {
                        for (let n = 0; n < stuff.length; n++) {
                            let w = imgs[n].width;
                            let h = imgs[n].width;

                            if (w > SpriteMap.WIDTH || h > SpriteMap.HEIGHT) {
                                console.error('IMAGE LARGER THAN SPRITEMAP!');
                                return;
                            }

                            if (x + w > SpriteMap.WIDTH) {
                                x = 0;
                                y += max_h;
                                max_h = 0;
                            }

                            if (y + h > SpriteMap.HEIGHT) {
                                console.error('SPRITEMAP NOT LARGE ENOUGH!');
                                return;
                            }

                            if (h > max_h) {
                                max_h = h;
                            }

                            spriteSheet.getContext('2d').drawImage(imgs[n], x, y, w, h);
                            that.map[stuff[n].ref] = {
                                x: x / SpriteMap.WIDTH,
                                y: y / SpriteMap.HEIGHT,
                                w: w / SpriteMap.WIDTH,
                                h: h / SpriteMap.HEIGHT
                            };
                            x += w;
                        }

                        that.spriteSheet = new Image(4096, 4096);
                        that.spriteSheet.src = spriteSheet.toDataURL();
                        that.spriteSheet.onload = function (e: Event) {
                            that.onload(e);
                        };
                    }
                }
            } ();
        }
    }

    public coords(ref: string): { x: number, y: number, w: number, h: number } {
        return this.map[ref];
    }
}