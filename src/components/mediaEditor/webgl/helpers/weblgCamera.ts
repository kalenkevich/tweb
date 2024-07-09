import {
  Matrix3,
  createMatrix3,
  translateMatrix3,
  scaleMatrix3,
  rotateMatrix3,
  invertMatrix3,
  multiplyMatrix3
} from '../math/matrixUtils';

export interface WebGlSceneCameraState {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly distance: number;
  readonly rotationInDegree: number;
}

export interface WebGlSceneCamera {
  getState(): WebGlSceneCameraState;
  update(newState: Partial<WebGlSceneCameraState>): void;
  getProjectionViewMatrix(): Matrix3;
}

/**
 * Creates Webgl scene camera.
 * @param initState Initial state of the scene camera.
 * @returns Creates Webgl scene camera.
 */
export function createWebglSceneCamera(initState: WebGlSceneCameraState): WebGlSceneCamera {
  let state: WebGlSceneCameraState = initState;

  return {
    getState() {
      return state;
    },
    update(newState: Partial<WebGlSceneCameraState>) {
      state = {
        ...state,
        ...newState
      };
    },
    getProjectionViewMatrix(): Matrix3 {
      const cameraMat = createMatrix3();
      translateMatrix3(cameraMat, [state.x, state.y]);
      scaleMatrix3(cameraMat, [state.width / state.distance, state.height / state.distance]);
      rotateMatrix3(cameraMat, (Math.PI / 180) * state.rotationInDegree);

      // update view projection matrix
      const viewMat = invertMatrix3(cameraMat);
      const viewProjectionMat = multiplyMatrix3(createMatrix3(), viewMat);

      return viewProjectionMat;
    }
  };
}
