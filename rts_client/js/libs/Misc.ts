module Misc {
    export function normalizeAngle(f: number): number {
        while (f > Math.PI * 2.0) {
            f -= Math.PI * 2.0;
        }
        while (f < 0.0) {
            f += Math.PI * 2.0;
        }
        return f;
    }

    export function angularDistance(a: number, b: number): number {
        let dists = Math.abs(a - b);

        if (dists > Math.PI) {
            return 2.0 * Math.PI - dists;
        }
        else {
            return dists;
        }
    }

    // Angle to turn, angle to turn towards, amount to turn
    export function turnTowards(a: number, b: number, turn: number): number {
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

    export function rotateAroundOrigin(cx: number, cy: number, x: number, y: number, ang: number): { x: number, y: number } {
        // translate point to origin
        let tempX = x - cx;
        let tempY = y - cy;
        let cos = Math.cos(ang);
        let sin = Math.sin(ang);

        // now apply rotation
        let rotatedX = tempX * cos - tempY * sin;
        let rotatedY = tempX * sin + tempY * cos;

        // translate back
        x = rotatedX + cx;
        y = rotatedY + cy;

        return { x: x, y: y };
    }

    export function rotatePoint(x: number, y: number, angle: number): { x: number, y: number } {
        let cos = Math.cos(angle);
        let sin = Math.sin(angle);

        return { x: x * cos - y * sin, y: x * sin + y * cos };
    }
}