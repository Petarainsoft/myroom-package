var F = Object.defineProperty;
var I = Object.getOwnPropertySymbols;
var N = Object.prototype.hasOwnProperty, W = Object.prototype.propertyIsEnumerable;
var x = (n, s, e) => s in n ? F(n, s, { enumerable: !0, configurable: !0, writable: !0, value: e }) : n[s] = e, L = (n, s) => {
  for (var e in s || (s = {}))
    N.call(s, e) && x(n, e, s[e]);
  if (I)
    for (var e of I(s))
      W.call(s, e) && x(n, e, s[e]);
  return n;
};
var z = (n, s, e) => new Promise((r, t) => {
  var l = (f) => {
    try {
      i(e.next(f));
    } catch (o) {
      t(o);
    }
  }, a = (f) => {
    try {
      i(e.throw(f));
    } catch (o) {
      t(o);
    }
  }, i = (f) => f.done ? r(f.value) : Promise.resolve(f.value).then(l, a);
  i((e = e.apply(n, s)).next());
});
import { P as k, j as U, k as Z, g as G, l as P, B, m as H, n as X, H as Y, W as j, A as V, I as g, o as _, p as D, q, C as m, b as C, E as O, r as S, s as $, t as J, u as v, v as K, w as Q, x as d } from "./index-D_-3xylv.js";
const nn = 20000630;
function tn(n, s) {
  if (n.getUint32(0, !0) != nn)
    throw new Error("Incorrect OpenEXR format");
  const e = n.getUint8(4), r = n.getUint8(5), t = {
    singleTile: !!(r & 2),
    longName: !!(r & 4),
    deepFormat: !!(r & 8),
    multiPart: !!(r & 16)
  };
  s.value = 8;
  const l = {};
  let a = !0;
  for (; a; ) {
    const i = k(n.buffer, s);
    if (!i)
      a = !1;
    else {
      const f = k(n.buffer, s), o = U(n, s), u = Z(n, s, f, o);
      u === void 0 ? G.Warn(`Unknown header attribute type ${f}'.`) : l[i] = u;
    }
  }
  if ((r & -5) != 0)
    throw new Error("Unsupported file format");
  return L({ version: e, spec: t }, l);
}
function en(n) {
  let s = n.byteLength;
  const e = new Array();
  let r = 0;
  const t = new DataView(n);
  for (; s > 0; ) {
    const l = t.getInt8(r++);
    if (l < 0) {
      const a = -l;
      s -= a + 1;
      for (let i = 0; i < a; i++)
        e.push(t.getUint8(r++));
    } else {
      const a = l;
      s -= 2;
      const i = t.getUint8(r++);
      for (let f = 0; f < a + 1; f++)
        e.push(i);
    }
  }
  return e;
}
function M(n) {
  return new DataView(n.array.buffer, n.offset.value, n.size);
}
function sn(n) {
  const s = n.viewer.buffer.slice(n.offset.value, n.offset.value + n.size), e = new Uint8Array(en(s)), r = new Uint8Array(e.length);
  return _(e), D(e, r), new DataView(r.buffer);
}
function R(n) {
  const s = n.array.slice(n.offset.value, n.offset.value + n.size), e = fflate.unzlibSync(s), r = new Uint8Array(e.length);
  return _(e), D(e, r), new DataView(r.buffer);
}
function an(n) {
  const s = n.array.slice(n.offset.value, n.offset.value + n.size), e = fflate.unzlibSync(s), r = n.lines * n.channels * n.width, t = n.type == 1 ? new Uint16Array(r) : new Uint32Array(r);
  let l = 0, a = 0;
  const i = new Array(4);
  for (let f = 0; f < n.lines; f++)
    for (let o = 0; o < n.channels; o++) {
      let u = 0;
      switch (n.type) {
        case 1:
          i[0] = l, i[1] = i[0] + n.width, l = i[1] + n.width;
          for (let h = 0; h < n.width; ++h) {
            const w = e[i[0]++] << 8 | e[i[1]++];
            u += w, t[a] = u, a++;
          }
          break;
        case 2:
          i[0] = l, i[1] = i[0] + n.width, i[2] = i[1] + n.width, l = i[2] + n.width;
          for (let h = 0; h < n.width; ++h) {
            const w = e[i[0]++] << 24 | e[i[1]++] << 16 | e[i[2]++] << 8;
            u += w, t[a] = u, a++;
          }
          break;
      }
    }
  return new DataView(t.buffer);
}
function rn(n) {
  const s = n.viewer, e = { value: n.offset.value }, r = new Uint16Array(n.width * n.scanlineBlockSize * (n.channels * n.type)), t = new Uint8Array(B);
  let l = 0;
  const a = new Array(n.channels);
  for (let c = 0; c < n.channels; c++)
    a[c] = {}, a[c].start = l, a[c].end = a[c].start, a[c].nx = n.width, a[c].ny = n.lines, a[c].size = n.type, l += a[c].nx * a[c].ny * a[c].size;
  const i = P(s, e), f = P(s, e);
  if (f >= B)
    throw new Error("Wrong PIZ_COMPRESSION BITMAP_SIZE");
  if (i <= f)
    for (let c = 0; c < f - i + 1; c++)
      t[c + i] = H(s, e);
  const o = new Uint16Array(q), u = X(t, o), h = U(s, e);
  Y(n.array, s, e, h, r, l);
  for (let c = 0; c < n.channels; ++c) {
    const p = a[c];
    for (let y = 0; y < a[c].size; ++y)
      j(r, p.start + y, p.nx, p.size, p.ny, p.nx * p.size, u);
  }
  V(o, r, l);
  let w = 0;
  const E = new Uint8Array(r.buffer.byteLength);
  for (let c = 0; c < n.lines; c++)
    for (let p = 0; p < n.channels; p++) {
      const y = a[p], b = y.nx * y.size, A = new Uint8Array(r.buffer, y.end * g, b * g);
      E.set(A, w), w += b * g, y.end += b;
    }
  return new DataView(E.buffer);
}
function ln(n, s, e, r) {
  return z(this, null, function* () {
    const t = {
      size: 0,
      viewer: s,
      array: new Uint8Array(s.buffer),
      offset: e,
      width: n.dataWindow.xMax - n.dataWindow.xMin + 1,
      height: n.dataWindow.yMax - n.dataWindow.yMin + 1,
      channels: n.channels.length,
      channelLineOffsets: {},
      scanOrder: () => 0,
      bytesPerLine: 0,
      outLineWidth: 0,
      lines: 0,
      scanlineBlockSize: 0,
      inputSize: null,
      type: 0,
      uncompress: null,
      getter: () => 0,
      format: 5,
      outputChannels: 0,
      decodeChannels: {},
      blockCount: null,
      byteArray: null,
      linearSpace: !1,
      textureType: 0
    };
    switch (n.compression) {
      case m.NO_COMPRESSION:
        t.lines = 1, t.uncompress = M;
        break;
      case m.RLE_COMPRESSION:
        t.lines = 1, t.uncompress = sn;
        break;
      case m.ZIPS_COMPRESSION:
        t.lines = 1, t.uncompress = R, yield C.LoadScriptAsync(O.FFLATEUrl);
        break;
      case m.ZIP_COMPRESSION:
        t.lines = 16, t.uncompress = R, yield C.LoadScriptAsync(O.FFLATEUrl);
        break;
      case m.PIZ_COMPRESSION:
        t.lines = 32, t.uncompress = rn;
        break;
      case m.PXR24_COMPRESSION:
        t.lines = 16, t.uncompress = an, yield C.LoadScriptAsync(O.FFLATEUrl);
        break;
      default:
        throw new Error(m[n.compression] + " is unsupported");
    }
    t.scanlineBlockSize = t.lines;
    const l = {};
    for (const o of n.channels)
      switch (o.name) {
        case "Y":
        case "R":
        case "G":
        case "B":
        case "A":
          l[o.name] = !0, t.type = o.pixelType;
      }
    let a = !1;
    if (l.R && l.G && l.B)
      a = !l.A, t.outputChannels = 4, t.decodeChannels = { R: 0, G: 1, B: 2, A: 3 };
    else if (l.Y)
      t.outputChannels = 1, t.decodeChannels = { Y: 0 };
    else
      throw new Error("EXRLoader.parse: file contains unsupported data channels.");
    if (t.type === 1)
      switch (r) {
        case S.Float:
          t.getter = $, t.inputSize = g;
          break;
        case S.HalfFloat:
          t.getter = P, t.inputSize = g;
          break;
      }
    else if (t.type === 2)
      switch (r) {
        case S.Float:
          t.getter = K, t.inputSize = v;
          break;
        case S.HalfFloat:
          t.getter = J, t.inputSize = v;
      }
    else
      throw new Error("Unsupported pixelType " + t.type + " for " + n.compression);
    t.blockCount = t.height / t.scanlineBlockSize;
    for (let o = 0; o < t.blockCount; o++)
      Q(s, e);
    const i = t.width * t.height * t.outputChannels;
    switch (r) {
      case S.Float:
        t.byteArray = new Float32Array(i), t.textureType = 1, a && t.byteArray.fill(1, 0, i);
        break;
      case S.HalfFloat:
        t.byteArray = new Uint16Array(i), t.textureType = 2, a && t.byteArray.fill(15360, 0, i);
        break;
      default:
        throw new Error("Unsupported type: " + r);
    }
    let f = 0;
    for (const o of n.channels)
      t.decodeChannels[o.name] !== void 0 && (t.channelLineOffsets[o.name] = f * t.width), f += o.pixelType * 2;
    return t.bytesPerLine = t.width * f, t.outLineWidth = t.width * t.outputChannels, n.lineOrder === "INCREASING_Y" ? t.scanOrder = (o) => o : t.scanOrder = (o) => t.height - 1 - o, t.outputChannels == 4 ? (t.format = 5, t.linearSpace = !0) : (t.format = 6, t.linearSpace = !1), t;
  });
}
function on(n, s, e, r) {
  const t = { value: 0 };
  for (let l = 0; l < n.height / n.scanlineBlockSize; l++) {
    const a = d(e, r) - s.dataWindow.yMin;
    n.size = U(e, r), n.lines = a + n.scanlineBlockSize > n.height ? n.height - a : n.scanlineBlockSize;
    const f = n.size < n.lines * n.bytesPerLine && n.uncompress ? n.uncompress(n) : M(n);
    r.value += n.size;
    for (let o = 0; o < n.scanlineBlockSize; o++) {
      const u = l * n.scanlineBlockSize, h = o + n.scanOrder(u);
      if (h >= n.height)
        continue;
      const w = o * n.bytesPerLine, E = (n.height - 1 - h) * n.outLineWidth;
      for (let c = 0; c < n.channels; c++) {
        const p = s.channels[c].name, y = n.channelLineOffsets[p], b = n.decodeChannels[p];
        if (b !== void 0) {
          t.value = w + y;
          for (let A = 0; A < n.width; A++) {
            const T = E + A * n.outputChannels + b;
            n.byteArray && (n.byteArray[T] = n.getter(f, t));
          }
        }
      }
    }
  }
}
class un {
  constructor() {
    this.supportCascades = !1;
  }
  /**
   * Uploads the cube texture data to the WebGL texture. It has already been bound.
   * @param _data contains the texture data
   * @param _texture defines the BabylonJS internal texture
   * @param _createPolynomials will be true if polynomials have been requested
   * @param _onLoad defines the callback to trigger once the texture is ready
   * @param _onError defines the callback to trigger in case of error
   * Cube texture are not supported by .exr files
   */
  loadCubeData(s, e, r, t, l) {
    throw ".exr not supported in Cube.";
  }
  /**
   * Uploads the 2D texture data to the WebGL texture. It has already been bound once in the callback.
   * @param data contains the texture data
   * @param texture defines the BabylonJS internal texture
   * @param callback defines the method to call once ready to upload
   */
  loadData(s, e, r) {
    return z(this, null, function* () {
      const t = new DataView(s.buffer), l = { value: 0 }, a = tn(t, l), i = yield ln(a, t, l, O.DefaultOutputType);
      on(i, a, t, l);
      const f = a.dataWindow.xMax - a.dataWindow.xMin + 1, o = a.dataWindow.yMax - a.dataWindow.yMin + 1;
      r(f, o, e.generateMipMaps, !1, () => {
        const u = e.getEngine();
        e.format = a.format, e.type = i.textureType, e.invertY = !1, e._gammaSpace = !a.linearSpace, i.byteArray && u._uploadDataToTextureDirectly(e, i.byteArray, 0, 0, void 0, !0);
      });
    });
  }
}
export {
  un as _ExrTextureLoader
};
//# sourceMappingURL=exrTextureLoader-DHmDgkaz.js.map
