class SpriteMap {
    public static WIDTH = 4096;
    public static HEIGHT = 4096;
    public onload: (e: Event) => any;
    public spriteSheet: HTMLImageElement;
    private map: { [index: string]: { x: number, y: number, w: number, h: number } } = {};

    constructor(stuff: { src: string, ref: string, color: TeamColor }[]) {
        let spriteSheet = document.createElement('canvas');
        spriteSheet.width = 4096;
        spriteSheet.height = 4096;
        let ctx = spriteSheet.getContext('2d');
        let that = this;
        let x = 0;
        let y = 0;
        let max_h = 0;
        let count = 0;
        let imgs: { ref: string, img: HTMLImageElement, color: TeamColor }[] = Array(stuff.length);

        for (let i = 0; i < stuff.length; i++) {
            let sprite = stuff[i];
            let img = document.createElement('img');
            imgs[i] = { ref: sprite.ref, img: img, color: sprite.color };
            img.src = sprite.src;
            img.onload = function () {
                return function (event: Event) {
                    count++;
                    if (count === stuff.length) {
                        imgs.sort(function (a, b) {
                            return b.img.width * b.img.height - a.img.width * a.img.height;
                        });
                        for (let n = 0; n < imgs.length; n++) {
                            let w = imgs[n].img.width;
                            let h = imgs[n].img.height;
                            let color = imgs[n].color;

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
                            
                            ctx.drawImage(imgs[n].img, x, y, w, h);
                            if (color) {
                                let imgData = ctx.getImageData(x, y, w, h);
                                let data = imgData.data;

                                for (var i = 0; i < data.length; i += 4) {
                                    if (data[i] === 255) {
                                        let intensity = data[i + 1];
                                        data[i] = color.red * intensity;
                                        data[i + 1] = color.green * intensity;
                                        data[i + 2] = color.blue * intensity;
                                        console.log('stuff');
                                    }
                                }

                                ctx.putImageData(imgData, x, y);
                            }

                            that.map[imgs[n].ref] = {
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