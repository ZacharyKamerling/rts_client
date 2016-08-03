var SpriteMap = (function () {
    function SpriteMap(stuff) {
        this.map = {};
        var spriteSheet = document.createElement('canvas');
        spriteSheet.width = 4096;
        spriteSheet.height = 4096;
        var that = this;
        var x = 0;
        var y = 0;
        var max_h = 0;
        var count = 0;
        var imgs = Array();
        for (var i = 0; i < stuff.length; i++) {
            var sprite = stuff[i];
            var img = document.createElement('img');
            imgs.push(img);
            img.src = sprite.src;
            img.onload = function () {
                return function (event) {
                    count++;
                    if (count == stuff.length) {
                        for (var n = 0; n < stuff.length; n++) {
                            var w = imgs[n].width;
                            var h = imgs[n].width;
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
})();
//# sourceMappingURL=sprite_map.js.map