"use strict";
var Cereal = (function () {
    function Cereal(dv) {
        this.offset = 0;
        this.dv = dv;
    }
    Cereal.prototype.get8 = function () {
        var val = this.dv.getInt8(this.offset);
        this.offset = this.offset + 1;
        return val;
    };
    Cereal.prototype.getU8 = function () {
        var val = this.dv.getUint8(this.offset);
        this.offset = this.offset + 1;
        return val;
    };
    Cereal.prototype.get16 = function () {
        var val = this.dv.getInt16(this.offset);
        this.offset = this.offset + 2;
        return val;
    };
    Cereal.prototype.getU16 = function () {
        var val = this.dv.getUint16(this.offset);
        this.offset = this.offset + 2;
        return val;
    };
    Cereal.prototype.get32 = function () {
        var val = this.dv.getInt32(this.offset);
        this.offset = this.offset + 4;
        return val;
    };
    Cereal.prototype.getU32 = function () {
        var val = this.dv.getUint32(this.offset);
        this.offset = this.offset + 4;
        return val;
    };
    Cereal.prototype.getF32 = function () {
        var val = this.dv.getFloat32(this.offset);
        this.offset = this.offset + 4;
        return val;
    };
    Cereal.prototype.getF64 = function () {
        var val = this.dv.getFloat64(this.offset);
        this.offset = this.offset + 8;
        return val;
    };
    Cereal.prototype.empty = function () {
        return (this.dv.byteLength === this.offset);
    };
    Cereal.prototype.string = function () {
        var offset = this.offset;
        var size = this.getU32();
        this.offset += size;
        return this.getUTF8String(offset, size);
    };
    Cereal.prototype.getUTF8String = function (offset, length) {
        var utf16 = new ArrayBuffer(length * 2);
        var utf16View = new Uint16Array(utf16);
        for (var i = 0; i < length; ++i) {
            utf16View[i] = this.dv.getUint8(offset + i);
        }
        return decodeURI(encodeURI(atob(String.fromCharCode.apply(null, utf16View))));
    };
    ;
    return Cereal;
}());
