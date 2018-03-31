class SpriteMap {
    constructor(stuff) {
        this.map = {};
        let spriteSheet = document.createElement('canvas');
        spriteSheet.width = SpriteMap.WIDTH;
        spriteSheet.height = SpriteMap.HEIGHT;
        let ctx = spriteSheet.getContext('2d');
        let that = this;
        let x = 0;
        let y = 0;
        let max_h = 0;
        let count = 0;
        let imgs = Array(stuff.length);
        for (let i = 0; i < stuff.length; i++) {
            let sprite = stuff[i];
            let img = document.createElement('img');
            imgs[i] = { ref: sprite.ref, img: img, color: sprite.color };
            img.src = sprite.src;
            img.onload = function () {
                return function (event) {
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
                                y += max_h + 1;
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
                                    if (data[i] === 255 && data[i + 3] !== 0) {
                                        let intensity = data[i + 1];
                                        data[i + 0] = color.red * intensity;
                                        data[i + 1] = color.green * intensity;
                                        data[i + 2] = color.blue * intensity;
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
                            x += w + 1;
                        }
                        that.spriteSheet = new Image(SpriteMap.WIDTH, SpriteMap.HEIGHT);
                        that.spriteSheet.src = spriteSheet.toDataURL();
                        that.spriteSheet.onload = function (e) {
                            that.onload(e);
                        };
                    }
                };
            }();
        }
    }
    coords(ref) {
        return this.map[ref];
    }
}
SpriteMap.WIDTH = 4096;
SpriteMap.HEIGHT = 4096;
