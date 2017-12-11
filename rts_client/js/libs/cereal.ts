"use strict";

// Consumes binary data
class Cereal {
    dv: DataView;
    offset: number = 0;
    constructor(dv: DataView) {
        this.dv = dv;
    }
    get8(): number {
        let val = this.dv.getInt8(this.offset);
        this.offset = this.offset + 1;
        return val;
    }

    getU8(): number {
        let val = this.dv.getUint8(this.offset);
        this.offset = this.offset + 1;
        return val;
    }

    get16(): number {
        let val = this.dv.getInt16(this.offset);
        this.offset = this.offset + 2;
        return val;
    }

    getU16(): number {
   		let val = this.dv.getUint16(this.offset);
   		this.offset = this.offset + 2;
   		return val;
   }

    get32(): number {
   		let val = this.dv.getInt32(this.offset);
   		this.offset = this.offset + 4;
   		return val;
   }

    getU32(): number {
   		let val = this.dv.getUint32(this.offset);
   		this.offset = this.offset + 4;
   		return val;
   }

    getF32(): number {
   		let val = this.dv.getFloat32(this.offset);
   		this.offset = this.offset + 4;
   		return val;
   }

    getF64(): number {
   		let val = this.dv.getFloat64(this.offset);
   		this.offset = this.offset + 8;
   		return val;
    }

    empty(): boolean {
        return (this.dv.byteLength === this.offset)
    }

    string(): string {
        let offset = this.offset;
        let size = this.getU32();
        this.offset += size;
        return this.getUTF8String(offset, size);
    }

    getUTF8String(offset: number, length: number): string {
        var utf16 = new ArrayBuffer(length * 2);
        var utf16View = new Uint16Array(utf16);
        for (var i = 0; i < length; ++i) {
            utf16View[i] = this.dv.getUint8(offset + i);
        }
        return decodeURI(encodeURI(atob(String.fromCharCode.apply(null, utf16View))));
    };
}