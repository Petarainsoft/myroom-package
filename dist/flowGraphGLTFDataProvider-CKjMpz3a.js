import { F as p, R as r } from "./index-D_-3xylv.js";
class l extends p {
  constructor(n) {
    var t, s;
    super();
    const a = n.glTF, i = ((t = a.animations) == null ? void 0 : t.map((o) => o._babylonAnimationGroup)) || [];
    this.animationGroups = this.registerDataOutput("animationGroups", r, i);
    const e = ((s = a.nodes) == null ? void 0 : s.map((o) => o._babylonTransformNode)) || [];
    this.nodes = this.registerDataOutput("nodes", r, e);
  }
  getClassName() {
    return "FlowGraphGLTFDataProvider";
  }
}
export {
  l as FlowGraphGLTFDataProvider
};
//# sourceMappingURL=flowGraphGLTFDataProvider-CKjMpz3a.js.map
