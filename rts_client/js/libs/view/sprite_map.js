var SpriteMap = (function () {
    function SpriteMap(stuff) {
        this.map = {};
        var spriteSheet = document.createElement('canvas');
        spriteSheet.width = SpriteMap.WIDTH;
        spriteSheet.height = SpriteMap.HEIGHT;
        var ctx = spriteSheet.getContext('2d');
        var that = this;
        var x = 0;
        var y = 0;
        var max_h = 0;
        var count = 0;
        var imgs = Array(stuff.length);
        for (var i = 0; i < stuff.length; i++) {
            var sprite = stuff[i];
            var img = document.createElement('img');
            imgs[i] = { ref: sprite.ref, img: img, color: sprite.color };
            img.src = sprite.src;
            img.onload = function () {
                return function (event) {
                    count++;
                    if (count === stuff.length) {
                        imgs.sort(function (a, b) {
                            return b.img.width * b.img.height - a.img.width * a.img.height;
                        });
                        for (var n = 0; n < imgs.length; n++) {
                            var w = imgs[n].img.width;
                            var h = imgs[n].img.height;
                            var color = imgs[n].color;
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
                                var imgData = ctx.getImageData(x, y, w, h);
                                var data = imgData.data;
                                for (var i = 0; i < data.length; i += 4) {
                                    if (data[i] === 255 && data[i + 3] !== 0) {
                                        var intensity = data[i + 1];
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
    SpriteMap.prototype.coords = function (ref) {
        return this.map[ref];
    };
    SpriteMap.WIDTH = 4096;
    SpriteMap.HEIGHT = 4096;
    return SpriteMap;
}());
