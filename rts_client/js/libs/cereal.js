"use strict";
class Cereal {
    constructor(dv) {
        this.offset = 0;
        this.dv = dv;
    }
    get8() {
        let val = this.dv.getInt8(this.offset);
        this.offset = this.offset + 1;
        return val;
    }
    getU8() {
        let val = this.dv.getUint8(this.offset);
        this.offset = this.offset + 1;
        return val;
    }
    get16() {
        let val = this.dv.getInt16(this.offset);
        this.offset = this.offset + 2;
        return val;
    }
    getU16() {
        let val = this.dv.getUint16(this.offset);
        this.offset = this.offset + 2;
        return val;
    }
    get32() {
        let val = this.dv.getInt32(this.offset);
        this.offset = this.offset + 4;
        return val;
    }
    getU32() {
        let val = this.dv.getUint32(this.offset);
        this.offset = this.offset + 4;
        return val;
    }
    getF32() {
        let val = this.dv.getFloat32(this.offset);
        this.offset = this.offset + 4;
        return val;
    }
    getF64() {
        let val = this.dv.getFloat64(this.offset);
        this.offset = this.offset + 8;
        return val;
    }
    empty() {
        return (this.dv.byteLength === this.offset);
    }
    getString() {
        let size = this.getU32();
        let offset = this.offset;
        this.offset += size;
        return this.getUTF8String(offset, size);
    }
    getUTF8String(offset, length) {
        var utf16 = new ArrayBuffer(length * 2);
        var utf16View = new Uint16Array(utf16);
        for (var i = 0; i < length; ++i) {
            utf16View[i] = this.dv.getUint8(offset + i);
        }
        return decodeURI(encodeURI(String.fromCharCode.apply(null, utf16View)));
    }
    ;
}
