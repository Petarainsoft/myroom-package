function y(r) {
  return Math.floor(r / 8);
}
function l(r) {
  return 1 << r % 8;
}
class w {
  /**
   * Creates a new bit array with a fixed size.
   * @param size The number of bits to store.
   */
  constructor(e) {
    this.size = e, this._byteArray = new Uint8Array(Math.ceil(this.size / 8));
  }
  /**
   * Gets the current value at the specified index.
   * @param bitIndex The index to get the value from.
   * @returns The value at the specified index.
   */
  get(e) {
    if (e >= this.size)
      throw new RangeError("Bit index out of range");
    const s = y(e), o = l(e);
    return (this._byteArray[s] & o) !== 0;
  }
  /**
   * Sets the value at the specified index.
   * @param bitIndex The index to set the value at.
   * @param value The value to set.
   */
  set(e, s) {
    if (e >= this.size)
      throw new RangeError("Bit index out of range");
    const o = y(e), n = l(e);
    s ? this._byteArray[o] |= n : this._byteArray[o] &= ~n;
  }
}
function E(r) {
  const e = [], s = r.length / 3;
  for (let t = 0; t < s; t++)
    e.push([r[t * 3], r[t * 3 + 1], r[t * 3 + 2]]);
  const o = /* @__PURE__ */ new Map();
  e.forEach((t, c) => {
    t.forEach((a) => {
      let i = o.get(a);
      i || o.set(a, i = []), i.push(c);
    });
  });
  const n = new w(s), f = [], p = (t) => {
    const c = [t];
    for (; c.length > 0; ) {
      const a = c.pop();
      n.get(a) || (n.set(a, !0), f.push(e[a]), e[a].forEach((i) => {
        const u = o.get(i);
        u && u.forEach((g) => {
          n.get(g) || c.push(g);
        });
      }));
    }
  };
  for (let t = 0; t < s; t++)
    n.get(t) || p(t);
  let h = 0;
  f.forEach((t) => {
    r[h++] = t[0], r[h++] = t[1], r[h++] = t[2];
  });
}
export {
  E as OptimizeIndices
};
//# sourceMappingURL=mesh.vertexData.functions-CtVVeVEO.js.map
