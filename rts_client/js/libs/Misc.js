var Misc;
(function (Misc) {
    function normalizeAngle(f) {
        while (f > Math.PI * 2.0) {
            f -= Math.PI * 2.0;
        }
        while (f < 0.0) {
            f += Math.PI * 2.0;
        }
        return f;
    }
    Misc.normalizeAngle = normalizeAngle;
    function angularDistance(a, b) {
        let dists = Math.abs(a - b);
        if (dists > Math.PI) {
            return 2.0 * Math.PI - dists;
        }
        else {
            return dists;
        }
    }
    Misc.angularDistance = angularDistance;
    function turnTowards(a, b, turn) {
        let dist = angularDistance(a, b);
        if (a > b) {
            if (a - b > Math.PI) {
                return normalizeAngle(a + turn);
            }
            else {
                return normalizeAngle(a - turn);
            }
        }
        else {
            if (b - a > Math.PI) {
                return normalizeAngle(a - turn);
            }
            else {
                return normalizeAngle(a + turn);
            }
        }
    }
    Misc.turnTowards = turnTowards;
    function rotateAroundOrigin(cx, cy, x, y, ang) {
        let tempX = x - cx;
        let tempY = y - cy;
        let cos = Math.cos(ang);
        let sin = Math.sin(ang);
        let rotatedX = tempX * cos - tempY * sin;
        let rotatedY = tempX * sin + tempY * cos;
        x = rotatedX + cx;
        y = rotatedY + cy;
        return { x: x, y: y };
    }
    Misc.rotateAroundOrigin = rotateAroundOrigin;
    function rotatePoint(x, y, angle) {
        let cos = Math.cos(angle);
        let sin = Math.sin(angle);
        return { x: x * cos - y * sin, y: x * sin + y * cos };
    }
    Misc.rotatePoint = rotatePoint;
})(Misc || (Misc = {}));
