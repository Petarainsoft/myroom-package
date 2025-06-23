import { useEffect } from 'react';
import {
  Scene, ShaderMaterial, MeshBuilder, Color3, Color4, Vector3, Matrix
} from '@babylonjs/core';

import { Effect } from '@babylonjs/core';

export interface UseSkyboxProps {
  scene: Scene | null;
  isSceneReady: boolean;
}

/**
 * Hook để tạo và quản lý skybox với shader tùy chỉnh
 */
export const useSkybox = ({ scene, isSceneReady }: UseSkyboxProps) => {
  useEffect(() => {
    if (!isSceneReady || !scene) return;

    // Tạo shader material cho skybox
    const createSkyboxMaterial = () => {
      // Định nghĩa vertex shader
      const skyboxVertexShader = `
        precision highp float;
        
        // Attributes
        attribute vec3 position;
        attribute vec2 uv;
        
        // Uniforms
        uniform mat4 world;
        uniform mat4 viewProjection;
        
        // Varying
        varying vec3 vPosition;
        varying vec3 vDirectionW;
        varying vec2 vUV;
        
        void main() {
          vec4 worldPosition = world * vec4(position, 1.0);
          gl_Position = viewProjection * worldPosition;
          
          // Sử dụng vị trí chính xác để tính toán hướng
          vPosition = position;
          
          // Tính toán hướng trong không gian thế giới - quan trọng cho skybox liền mạch
          vDirectionW = normalize(worldPosition.xyz);
          
          vUV = uv;
        }
      `;

      // Định nghĩa fragment shader với hiệu ứng bầu trời và mây
      const skyboxFragmentShader = `
        precision highp float;
        
        varying vec3 vPosition;
        varying vec3 vDirectionW;
        varying vec2 vUV;
        
        uniform float time;
        uniform vec3 cameraPosition;
        
        // Simplified FXAA anti-aliasing for skybox (without texture sampling)
        vec3 applyFXAA(vec3 color, vec2 fragCoord) {
          // Simplified version that just applies some edge detection and smoothing
          // This version doesn't require texture sampling which was causing issues
          
          // Apply a simple sharpening filter instead
          float sharpen = 0.5;
          vec3 blurred = color * (1.0 - sharpen);
          return color * (1.0 + sharpen) - blurred;
        }
        
        // Atmospheric scattering
        vec3 atmosphere(vec3 r) {
          float atmosphere = 1.0 - r.y;
          return vec3(0.3, 0.6, 1.0) * pow(atmosphere, 1.5);
        }
        
        // Improved noise function for clouds - sử dụng hash để tạo giá trị ngẫu nhiên
        float hash(float n) {
          return fract(sin(n) * 43758.5453);
        }
        
        float noise(vec3 p) {
          // Sử dụng thuật toán noise cải tiến để tạo kết quả mượt mà hơn
          vec3 i = floor(p);
          vec3 f = fract(p);
          f = f * f * (3.0 - 2.0 * f); // Smooth interpolation
          
          float n = i.x + i.y * 157.0 + 113.0 * i.z;
          return mix(mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
                         mix(hash(n + 157.0), hash(n + 158.0), f.x), f.y),
                     mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                         mix(hash(n + 270.0), hash(n + 271.0), f.x), f.y), f.z);
        }
        
        // Improved cloud function
        float clouds(vec3 p) {
          // Sử dụng nhiều lớp noise để tạo mây chi tiết hơn
          float n = noise(p * 0.3);
          n += noise(p * 0.6) * 0.5;
          n += noise(p * 1.2) * 0.25;
          n = n / 1.75; // Normalize
          return smoothstep(0.4, 0.6, n);
        }
        
        void main() {
          // Sử dụng vDirectionW để đảm bảo các mặt liền mạch
          vec3 dir = normalize(vDirectionW);
          
          // Base sky color based on height (y coordinate)
          float height = dir.y * 0.5 + 0.5; // Normalize to 0-1 range
          vec3 skyColor = mix(
            vec3(0.1, 0.4, 0.8), // Horizon color (blue)
            vec3(0.0, 0.15, 0.4), // Zenith color (darker blue)
            pow(height, 0.5) // Gradient power
          );
          
          // Add atmospheric scattering - sử dụng vDirectionW để đảm bảo liền mạch
          skyColor += atmosphere(dir) * 0.3;
          
          // Add subtle time-based color variation
          skyColor += vec3(sin(time * 0.1) * 0.02, sin(time * 0.13) * 0.02, sin(time * 0.15) * 0.02);
          
          // Cải thiện hiệu ứng mây để liền mạch hơn
          // Sử dụng vDirectionW để đảm bảo mây liền mạch giữa các mặt của skybox
          // Thêm tham số thời gian để mây di chuyển
          vec3 cloudDir = dir;
          
          // Tạo nhiều lớp mây với tỷ lệ khác nhau
          float cloudDensity1 = clouds(cloudDir * 8.0 + vec3(time * 0.02, 0.0, 0.0)) * 0.5;
          float cloudDensity2 = clouds(cloudDir * 4.0 + vec3(time * 0.04, 0.0, 0.0)) * 0.3;
          float cloudDensity3 = clouds(cloudDir * 2.0 + vec3(time * 0.01, 0.0, 0.0)) * 0.2;
          
          // Kết hợp các lớp mây
          float cloudDensity = cloudDensity1 + cloudDensity2 + cloudDensity3;
          cloudDensity = min(cloudDensity, 1.0); // Giới hạn mật độ tối đa
          
          // Chỉ hiển thị mây trên đường chân trời với transition mượt mà hơn
          cloudDensity *= smoothstep(-0.05, 0.15, dir.y);
          
          // Tạo màu mây với gradient từ trắng đến xám nhạt
          vec3 cloudColor = mix(vec3(1.0, 1.0, 1.0), vec3(0.9, 0.9, 0.95), cloudDensity * 0.3);
          
          // Trộn mây với bầu trời
          skyColor = mix(skyColor, cloudColor, cloudDensity * 0.6);
          
          // Thêm hiệu ứng sun rays (tia nắng)
          vec3 sunDir = normalize(vec3(0.0, 0.2, 1.0)); // Hướng mặt trời
          float sunIntensity = max(0.0, dot(dir, sunDir));
          vec3 sunColor = vec3(1.0, 0.9, 0.7) * pow(sunIntensity, 32.0) * 2.0;
          skyColor += sunColor;
          
          // Cải thiện contrast và sharpening
          skyColor = mix(skyColor, skyColor * skyColor, 0.2);
          
          // Apply FXAA
          skyColor = applyFXAA(skyColor, vUV);
          
          // Đảm bảo màu sắc nằm trong phạm vi hợp lệ
          skyColor = clamp(skyColor, 0.0, 1.0);
          
          // Final color
          gl_FragColor = vec4(skyColor, 1.0);
        }
      `;

      // Đăng ký shaders trước khi tạo material
      Effect.ShadersStore['skyboxVertexShader'] = skyboxVertexShader;
      Effect.ShadersStore['skyboxFragmentShader'] = skyboxFragmentShader;

      // Tạo shader material
      const skyboxMaterial = new ShaderMaterial(
        'skyboxMaterial',
        scene,
        {
          vertex: 'skybox',
          fragment: 'skybox',
        },
        {
          attributes: ['position', 'uv'],
          uniforms: ['world', 'viewProjection', 'time', 'cameraPosition'],
        }
      );

      // Thiết lập các thuộc tính của material
      skyboxMaterial.backFaceCulling = false;
      skyboxMaterial.disableDepthWrite = true;

      // Thêm time uniform cho animation
      let time = 0;
      scene.registerBeforeRender(() => {
        time += scene.getEngine().getDeltaTime() / 1000;
        skyboxMaterial.setFloat('time', time);
        skyboxMaterial.setVector3('cameraPosition', scene.activeCamera!.position);
      });

      return skyboxMaterial;
    };

    // Tạo skybox mesh sử dụng sphere thay vì box để tránh các đường nối ở góc
    const createSkybox = () => {
      const skyboxMaterial = createSkyboxMaterial();
      
      // Sử dụng sphere thay vì box để tạo skybox mượt mà hơn
      // Tăng segments để có hình cầu mượt mà hơn
      const skybox = MeshBuilder.CreateSphere(
        'skyBox',
        {
          diameter: 2000.0,
          segments: 32, // Số lượng segments cao hơn cho hình cầu mượt mà
          sideOrientation: 1 // BACKSIDE - để render bên trong sphere
        },
        scene
      );
      
      // Thiết lập các thuộc tính quan trọng cho skybox
      skybox.infiniteDistance = true;
      skybox.renderingGroupId = 0; // Render trước các đối tượng khác
      
      // Đảm bảo skybox luôn hiển thị đúng
      skybox.material = skyboxMaterial;
      
      // Đặt skybox ở vị trí camera
      if (scene.activeCamera) {
        skybox.position = scene.activeCamera.position.clone();
        scene.registerBeforeRender(() => {
          if (scene.activeCamera) {
            skybox.position = scene.activeCamera.position.clone();
          }
        });
      }
      
      return skybox;
    };

    // Tạo skybox
    const skybox = createSkybox();

    // Cleanup khi component unmount
    return () => {
      if (skybox && !skybox.isDisposed()) {
        skybox.dispose(false, true);
      }
    };
  }, [isSceneReady, scene]);
};

export default useSkybox;