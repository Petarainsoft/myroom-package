import { h as r, i as n } from "./index-D_-3xylv.js";
class i {
  constructor() {
    this.supportCascades = !1;
  }
  /**
   * Uploads the cube texture data to the WebGL texture. It has already been bound.
   */
  loadCubeData() {
    throw ".env not supported in Cube.";
  }
  /**
   * Uploads the 2D texture data to the WebGL texture. It has already been bound once in the callback.
   * @param data contains the texture data
   * @param texture defines the BabylonJS internal texture
   * @param callback defines the method to call once ready to upload
   */
  loadData(e, t, o) {
    const s = new Uint8Array(e.buffer, e.byteOffset, e.byteLength), a = r(s);
    o(a.width, a.height, t.generateMipMaps, !1, () => {
      n(t, s);
    });
  }
}
export {
  i as _TGATextureLoader
};
//# sourceMappingURL=tgaTextureLoader-DZR2qiPJ.js.map
