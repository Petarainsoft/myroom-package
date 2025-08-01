import { K as o, f as p, g } from "./index-D_-3xylv.js";
function f(l) {
  switch (l) {
    case 35916:
      return 33776;
    case 35918:
      return 33778;
    case 35919:
      return 33779;
    case 37493:
      return 37492;
    case 37497:
      return 37496;
    case 37495:
      return 37494;
    case 37840:
      return 37808;
    case 36493:
      return 36492;
  }
  return null;
}
class d {
  constructor() {
    this.supportCascades = !1;
  }
  /**
   * Uploads the cube texture data to the WebGL texture. It has already been bound.
   * @param data contains the texture data
   * @param texture defines the BabylonJS internal texture
   * @param createPolynomials will be true if polynomials have been requested
   * @param onLoad defines the callback to trigger once the texture is ready
   */
  loadCubeData(n, e, r, i) {
    if (Array.isArray(n))
      return;
    e._invertVScale = !e.invertY;
    const a = e.getEngine(), s = new o(n, 6), t = s.numberOfMipmapLevels > 1 && e.generateMipMaps;
    a._unpackFlipY(!0), s.uploadLevels(e, e.generateMipMaps), e.width = s.pixelWidth, e.height = s.pixelHeight, a._setCubeMapTextureParams(e, t, s.numberOfMipmapLevels - 1), e.isReady = !0, e.onLoadedObservable.notifyObservers(e), e.onLoadedObservable.clear(), i && i();
  }
  /**
   * Uploads the 2D texture data to the WebGL texture. It has already been bound once in the callback.
   * @param data contains the texture data
   * @param texture defines the BabylonJS internal texture
   * @param callback defines the method to call once ready to upload
   * @param options
   */
  loadData(n, e, r, i) {
    if (o.IsValid(n)) {
      e._invertVScale = !e.invertY;
      const a = new o(n, 1), s = f(a.glInternalFormat);
      s ? (e.format = s, e._useSRGBBuffer = e.getEngine()._getUseSRGBBuffer(!0, e.generateMipMaps), e._gammaSpace = !0) : e.format = a.glInternalFormat, r(a.pixelWidth, a.pixelHeight, e.generateMipMaps, !0, () => {
        a.uploadLevels(e, e.generateMipMaps);
      }, a.isInvalid);
    } else p.IsValid(n) ? new p(e.getEngine())._uploadAsync(n, e, i).then(() => {
      r(e.width, e.height, e.generateMipMaps, !0, () => {
      }, !1);
    }, (s) => {
      g.Warn(`Failed to load KTX2 texture data: ${s.message}`), r(0, 0, !1, !1, () => {
      }, !0);
    }) : (g.Error("texture missing KTX identifier"), r(0, 0, !1, !1, () => {
    }, !0));
  }
}
export {
  d as _KTXTextureLoader
};
//# sourceMappingURL=ktxTextureLoader-CHf1lk4b.js.map
