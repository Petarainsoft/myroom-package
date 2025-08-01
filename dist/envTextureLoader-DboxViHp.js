import { G as t, U as d, c } from "./index-D_-3xylv.js";
class h {
  constructor() {
    this.supportCascades = !1;
  }
  /**
   * Uploads the cube texture data to the WebGL texture. It has already been bound.
   * @param data contains the texture data
   * @param texture defines the BabylonJS internal texture
   * @param createPolynomials will be true if polynomials have been requested
   * @param onLoad defines the callback to trigger once the texture is ready
   * @param onError defines the callback to trigger in case of error
   */
  loadCubeData(i, e, v, n, a) {
    if (Array.isArray(i))
      return;
    const s = t(i);
    if (s) {
      e.width = s.width, e.height = s.width;
      try {
        d(e, s), c(e, i, s).then(() => {
          e.isReady = !0, e.onLoadedObservable.notifyObservers(e), e.onLoadedObservable.clear(), n && n();
        }, (l) => {
          a == null || a("Can not upload environment levels", l);
        });
      } catch (l) {
        a == null || a("Can not upload environment file", l);
      }
    } else a && a("Can not parse the environment file", null);
  }
  /**
   * Uploads the 2D texture data to the WebGL texture. It has already been bound once in the callback.
   */
  loadData() {
    throw ".env not supported in 2d.";
  }
}
export {
  h as _ENVTextureLoader
};
//# sourceMappingURL=envTextureLoader-DboxViHp.js.map
