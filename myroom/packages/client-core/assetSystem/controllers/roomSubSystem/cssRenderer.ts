import { Mesh, Matrix, Scene, Camera, Observer, Nullable, Vector3, MeshBuilder, StandardMaterial, Color4 } from '@babylonjs/core';
import { Constants } from "../../constants";
import { ConstantsEx } from "../../constantsEx";

const ENABLE_POINTER_EVENT = false;
export class CSSRendererManager {
  private _container: HTMLDivElement | null = null;
  private _css3DRenderer: CSS3DRenderer | null = null;
  private _resizeListener: (() => void) | null = null;
  private _pointerListener: ((evt: PointerEvent) => void) | null = null;
  private _beforeRenderListener: Nullable<Observer<Scene>> = null;
  private _scene: Scene | null = null;
  private _meshes: Array<CSS3DObject> = [];
  private _youtubeFocused: boolean = false;
  private _touchX: number = 0;
  private _touchY: number = 0;
  private _prevTouchX: number = 0;
  private _prevTouchY: number = 0;

  // youtube용 3d plane 생성시 사용하는 함수
  public createYoutubeCSSPlane(scene: Scene, videoId: string, pos: Vector3, rot: Vector3, sca: Vector3): Nullable<Mesh> {
    // youtube video는 가로형으로 고정한다.
    const width = 480;
    const height = 360;
    const url = [
      'https://www.youtube.com/embed/',
      videoId,
      '?rel=0&enablejsapi=1&disablekb=1&autoplay=1&controls=0&fs=0&modestbranding=1&mute=1',
      // for loop
      '&loop=1&playlist=',
      videoId,
    ].join('');
    const id = 'video-' + videoId;

    return this.createIFrameCSSPlane(scene, url, id, width, height, pos, rot, sca);
  }

  // 일반적인 web page를 iframe으로 3d plane에 생성시
  public createIFrameCSSPlane(scene: Scene, url: string, id: string, width: number, height: number, pos: Vector3, rot: Vector3, sca: Vector3): Nullable<Mesh> {
    if (!this._css3DRenderer) {
      this.initialize(scene);
    }

    // The CSS object will follow this mesh
    var plane = MeshBuilder.CreatePlane(Constants.IFRAME_3D_PLANE_NAME, { width: 1, height: 1 }, this._scene);
    plane.position = pos.clone();
    plane.rotation = rot.clone();
    plane.scaling = sca.clone();
    //plane.scaling.x = sca.x;
    //plane.scaling.y = sca.y;

    const cssObject = this._createCSSObject(plane, url, id, width, height);
    this._createMaskingScreen(plane);
    this._meshes.push(cssObject);
    //console.log("createIFrameCSSPlane - add mesh", this._meshes.length);

    plane.onDisposeObservable.add(() => {
      const index = this._meshes.indexOf(cssObject);
      if (index !== -1) {
        this._meshes.splice(index, 1);
        cssObject.dispose();
        console.log("createIFrameCSSPlane - remove mesh", this._meshes.length);
      }
    });

    return plane;
  }

  public initialize(scene: Scene) {
    this._scene = scene;
    if (!this._css3DRenderer) {
      // scene의 clear color가 투명이어야 보인다.
      this._scene.clearColor = new Color4(0, 0, 0, 0);
      this._setupRenderer(scene);
    }
  }

  public finalize() {
    if (this._resizeListener) {
      window.removeEventListener('resize', this._resizeListener);
      this._resizeListener = null;
    }
    if (this._pointerListener) {
      window.removeEventListener('pointerdown', this._pointerListener);
      this._pointerListener = null;
    }
    if (this._beforeRenderListener) {
      this._scene?.onBeforeRenderObservable.remove(this._beforeRenderListener);
      this._beforeRenderListener = null;
    }
    if (this._container) {
      this._container.remove();
      this._container = null;
    }
  }

  private _createCSSObject(mesh: Mesh, url: string, id: string, width: number, height: number): CSS3DObject {
    var div = document.createElement('div');
    div.style.width = width + 'px';
    div.style.height = height + 'px';
    div.style.backgroundColor = '#000';
    div.style.zIndex = '1';

    var CSSobject = new CSS3DObject(div, mesh);

    var iframe = document.createElement('iframe');
    iframe.id = id;
    iframe.style.width = width + 'px';
    iframe.style.height = height + 'px';
    iframe.style.border = '0px';
    iframe.allow = 'autoplay';
    iframe.src = url;
    //    iframe.style.pointerEvents = 'auto';

    div.appendChild(iframe);
    /*
        div.addEventListener('mouseout', () => {
          this._youtubeFocused = false;
          console.log("CANVAS");
          document.getElementsByTagName('body')[0].style.pointerEvents = 'auto';
        });
    */
    return CSSobject;
  }

  private _createMaskingScreen(maskMesh: Mesh) {
    if (!this._scene) return;

    let depthMask = new StandardMaterial('matDepthMask', this._scene);
    depthMask.backFaceCulling = true;

    maskMesh.material = depthMask;

    maskMesh.onBeforeRenderObservable.add(() => this._scene?.getEngine()?.setColorWrite(false));
    maskMesh.onAfterRenderObservable.add(() => this._scene?.getEngine()?.setColorWrite(true));
  }

  private _setupRenderer(scene: Scene) {
    const canvas = scene.getEngine()?.getRenderingCanvas();
    let canvasZone = canvas?.parentElement;
    if (!canvas || !canvasZone) return;

    let container = document.createElement('div');
    this._container = container;
    container.id = 'css-container';
    container.style.position = 'absolute';
    container.style.width = `${canvas.offsetWidth}px`;
    container.style.height = `${canvas.offsetHeight}px`;
    container.style.top = `${canvas.offsetTop}px`;
    container.style.left = `${canvas.offsetLeft}px`;
    container.style.zIndex = '-1';
    //container.style.pointerEvents = 'none';

    // background 이미지가 있으면, 투명화가 안되므로, 없앤다.
    canvasZone.style.backgroundImage = 'none';
    canvas.style.backgroundColor = 'transparent';

    canvasZone.insertBefore(container, canvasZone.firstChild);

    let renderer = new CSS3DRenderer();
    this._css3DRenderer = renderer;
    container.appendChild(renderer.domElement);
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

    this._resizeListener = () => {
      renderer.setSize(canvas!.offsetWidth, canvas!.offsetHeight);
    };

    window.addEventListener('resize', this._resizeListener);

    if (ENABLE_POINTER_EVENT) {
      const self = this;
      this._pointerListener = (event: PointerEvent) => {
        if (canvas) {
          self._touchX = Math.round(event.clientX - canvas.offsetLeft);
          self._touchY = Math.round(event.clientY - canvas.offsetTop);
        }
      }

      window.addEventListener('pointerdown', this._pointerListener);
    }

    this._beforeRenderListener = scene?.onBeforeRenderObservable.add(() => {
      if (scene && scene.activeCamera && this._meshes.length > 0) renderer.render(scene, scene.activeCamera, this._meshes);

      if (ENABLE_POINTER_EVENT && (this._prevTouchX !== this._touchX || this._prevTouchY !== this._touchY)) {
        this._prevTouchX = this._touchX;
        this._prevTouchY = this._touchY;

        const pick = scene.pick(this._touchX, this._touchY);
        if (pick.pickedMesh) {
          if (pick.pickedMesh.name === Constants.IFRAME_3D_PLANE_NAME) {
            if (!this._youtubeFocused) {
              this._youtubeFocused = true;
              console.log("YOUTUBE: this is youtube iframe");
              const body = document.getElementsByTagName('body')[0];
              body.style.pointerEvents = 'none';
            }
            return;
          }
        }

        if (this._youtubeFocused) {
          this._youtubeFocused = false;
          console.log("YOUTUBE: this is out of youtube iframe");
          const body = document.getElementsByTagName('body')[0];
          body.style.pointerEvents = 'auto';
        }
      }

    });

    scene?.setRenderingOrder(0, (a, b) => {
      return a.getMesh().name === Constants.IFRAME_3D_PLANE_NAME
        ? -1
        : b.getMesh().name === Constants.IFRAME_3D_PLANE_NAME
          ? 1
          : 0;
    });
  }
}

// css와 babylon node의 rotation 의미가 다르므로, 아래처럼 targetPos의 위치값을 refreshPos 함수를 통해서 매번 update해야 한다.
class CSS3DObject extends Mesh {
  public element: HTMLElement;
  private targetMesh: Mesh | null = null;
  constructor(element: HTMLElement, mesh: Mesh) {
    super('cssPlane');
    this.targetMesh = mesh;
    this.element = element;
    this.element.style.position = 'absolute';
    this.element.style.pointerEvents = 'auto';
    this.refreshPos();
  }

  public refreshPos() {
    this.position.copyFrom(this.targetMesh!.getAbsolutePosition());
    const rot = this.targetMesh!.absoluteRotationQuaternion.toEulerAngles();
    this.rotation.y = -rot.y;
    this.rotation.x = -rot.x;
    this.rotation.z = rot.z;
    const sca = this.targetMesh!.absoluteScaling;
    this.scaling.copyFrom(new Vector3(Math.abs(sca.x), Math.abs(sca.y), Math.abs(sca.z)));
  }

  public dispose() {
    super.dispose();
    this.element.remove();
  }
}

class CSS3DRenderer {
  private cache: any;
  public domElement: HTMLDivElement;
  private cameraElement: HTMLDivElement;
  private width: number = 0;
  private height: number = 0;
  private widthHalf: number = 0;
  private heightHalf: number = 0;
  public isIE: boolean = false;

  constructor() {
    this.cache = {
      camera: { fov: 0, style: '' },
      objects: new WeakMap(),
    };

    var domElement = document.createElement('div');
    domElement.style.overflow = 'hidden';

    this.domElement = domElement;
    this.cameraElement = document.createElement('div');
    this.isIE = false;

    if (!this.isIE) {
      this.cameraElement.style.webkitTransformStyle = 'preserve-3d';
      this.cameraElement.style.transformStyle = 'preserve-3d';
    }
    this.cameraElement.style.pointerEvents = 'none';

    domElement.appendChild(this.cameraElement);
  }

  public getSize() {
    return {
      width: this.width,
      height: this.height,
    };
  }

  public setSize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.widthHalf = this.width / 2;
    this.heightHalf = this.height / 2;

    this.domElement.style.width = width + 'px';
    this.domElement.style.height = height + 'px';

    this.cameraElement.style.width = width + 'px';
    this.cameraElement.style.height = height + 'px';
  }

  private epsilon(value: number): number {
    return Math.abs(value) < 1e-10 ? 0 : value;
  }

  public getCameraCSSMatrix(matrix: Matrix): string {
    var elements = matrix.m;

    return (
      'matrix3d(' +
      this.epsilon(elements[0]) +
      ',' +
      this.epsilon(-elements[1]) +
      ',' +
      this.epsilon(elements[2]) +
      ',' +
      this.epsilon(elements[3]) +
      ',' +
      this.epsilon(elements[4]) +
      ',' +
      this.epsilon(-elements[5]) +
      ',' +
      this.epsilon(elements[6]) +
      ',' +
      this.epsilon(elements[7]) +
      ',' +
      this.epsilon(elements[8]) +
      ',' +
      this.epsilon(-elements[9]) +
      ',' +
      this.epsilon(elements[10]) +
      ',' +
      this.epsilon(elements[11]) +
      ',' +
      this.epsilon(elements[12]) +
      ',' +
      this.epsilon(-elements[13]) +
      ',' +
      this.epsilon(elements[14]) +
      ',' +
      this.epsilon(elements[15]) +
      ')'
    );
  }

  public getObjectCSSMatrix(matrix: Matrix, cameraCSSMatrix: string): string {
    var elements = matrix.m;
    var matrix3d =
      'matrix3d(' +
      this.epsilon(elements[0]) +
      ',' +
      this.epsilon(elements[1]) +
      ',' +
      this.epsilon(elements[2]) +
      ',' +
      this.epsilon(elements[3]) +
      ',' +
      this.epsilon(-elements[4]) +
      ',' +
      this.epsilon(-elements[5]) +
      ',' +
      this.epsilon(-elements[6]) +
      ',' +
      this.epsilon(-elements[7]) +
      ',' +
      this.epsilon(elements[8]) +
      ',' +
      this.epsilon(elements[9]) +
      ',' +
      this.epsilon(elements[10]) +
      ',' +
      this.epsilon(elements[11]) +
      ',' +
      this.epsilon(elements[12]) +
      ',' +
      this.epsilon(elements[13]) +
      ',' +
      this.epsilon(elements[14]) +
      ',' +
      this.epsilon(elements[15]) +
      ')';

    if (this.isIE) {
      return (
        'translate(-50%,-50%)' +
        'translate(' +
        this.widthHalf +
        'px,' +
        this.heightHalf +
        'px)' +
        cameraCSSMatrix +
        matrix3d
      );
    }
    return 'translate(-50%,-50%)' + matrix3d;
  }

  public renderObject(
    object: any,
    scene: Scene,
    camera: Camera,
    cameraCSSMatrix: string,
  ) {
    if (object instanceof CSS3DObject) {
      var style;
      var objectMatrixWorld = object.getWorldMatrix().clone();
      var camMatrix = camera.getWorldMatrix();
      var innerMatrix = Float32Array.from(objectMatrixWorld.toArray());

      // Set scaling
      // youtube 면이 뒤집혀서, x,y축 모두 음수로 설정한다.
      const youtubeVideoWidth = -4.8;
      const youtubeVideoHeight = -3.6;

      innerMatrix[0] *= 0.01 / youtubeVideoWidth;
      innerMatrix[2] *= 0.01 / youtubeVideoWidth;
      innerMatrix[5] *= 0.01 / youtubeVideoHeight;
      innerMatrix[1] *= 0.01 / youtubeVideoWidth;
      innerMatrix[6] *= 0.01 / youtubeVideoHeight;
      innerMatrix[4] *= 0.01 / youtubeVideoHeight;

      // Set position from camera
      innerMatrix[12] = -camMatrix.m[12] + object.position.x;
      innerMatrix[13] = -camMatrix.m[13] + object.position.y;
      innerMatrix[14] = camMatrix.m[14] - object.position.z;
      innerMatrix[15] = camMatrix.m[15] * 0.00001;

      objectMatrixWorld = Matrix.FromArray(innerMatrix);
      //if (this.isIE) {
      // IE will round numbers like 1e-005 to zero so we need to scale whole matrix up.
      // Side-effect is reduced accuracy with CSS object mapping to Babylon.js object
      // 이것을 해야 모바일에서 pointer event가 발생한다.
      objectMatrixWorld = objectMatrixWorld.scale(100);
      //}
      style = this.getObjectCSSMatrix(objectMatrixWorld, cameraCSSMatrix);
      var element = object.element;
      var cachedObject = this.cache.objects.get(object);

      if (cachedObject === undefined || cachedObject.style !== style) {
        element.style.webkitTransform = style;
        element.style.transform = style;

        var objectData = { style: style };

        this.cache.objects.set(object, objectData);
      }
      if (element.parentNode !== this.cameraElement) {
        this.cameraElement.appendChild(element);
      }
    } else if (object instanceof Scene) {
      for (var i = 0, l = object.meshes.length; i < l; i++) {
        this.renderObject(object.meshes[i], scene, camera, cameraCSSMatrix);
      }
    }
  }

  public render(scene: Scene, camera: Camera, meshes: Array<CSS3DObject> | null) {
    var projectionMatrix = camera.getProjectionMatrix();
    var fov = projectionMatrix.m[5] * this.heightHalf;

    if (this.cache.camera.fov !== fov) {
      if (camera.mode == Camera.PERSPECTIVE_CAMERA) {
        this.domElement.style.webkitPerspective = fov + 'px';
        this.domElement.style.perspective = fov + 'px';
      } else {
        this.domElement.style.webkitPerspective = '';
        this.domElement.style.perspective = '';
      }
      this.cache.camera.fov = fov;
    }

    if (camera.parent === null) camera.computeWorldMatrix();

    var matrixWorld = camera.getWorldMatrix().clone();
    var rotation = matrixWorld.clone().getRotationMatrix().transpose();
    var innerMatrix = Float32Array.from(matrixWorld.toArray());

    innerMatrix[1] = rotation.m[1];
    innerMatrix[2] = -rotation.m[2];
    innerMatrix[4] = -rotation.m[4];
    innerMatrix[6] = -rotation.m[6];
    innerMatrix[8] = -rotation.m[8];
    innerMatrix[9] = -rotation.m[9];

    matrixWorld = Matrix.FromArray(innerMatrix);

    var cameraCSSMatrix =
      'translateZ(' + fov + 'px)' + this.getCameraCSSMatrix(matrixWorld);

    var style =
      cameraCSSMatrix +
      'translate(' +
      this.widthHalf +
      'px,' +
      this.heightHalf +
      'px)';

    if (this.cache.camera.style !== style && !this.isIE) {
      this.cameraElement.style.webkitTransform = style;
      this.cameraElement.style.transform = style;
      this.cache.camera.style = style;
    }

    if (meshes) {
      for (const mesh of meshes) {
        mesh.refreshPos();
        this.renderObject(mesh, scene, camera, cameraCSSMatrix);
      }
    } else {
      this.renderObject(scene, scene, camera, cameraCSSMatrix);
    }
  }
}
