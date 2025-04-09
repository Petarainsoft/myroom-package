import style from './style.module.scss';
import Balloon from './Balloon';
import useBalloonLayer from './hooks';
import { useAtomValue } from 'jotai';
import { isShowBalloonLayerAtom, uiPlaceModeAtom } from '@/common/stores';
import { useMemo } from 'react';

const BalloonLayer = () => {
  const { floatingBalloons, handleBalloonPopped } = useBalloonLayer();
  const isShowBalloonLayer = useAtomValue(isShowBalloonLayerAtom);
  const uiPlaceMode = useAtomValue(uiPlaceModeAtom);
  const isHidden = useMemo(() => {
    return !isShowBalloonLayer || uiPlaceMode;
  }, [isShowBalloonLayer, uiPlaceMode]);
  console.log(
    'isHidden : ',
    isHidden,
    ' isShowBalloonLayer : ',
    isShowBalloonLayer,
    ' uiPlaceMode : ',
    uiPlaceMode,
  );
  return (
    <div
      id="balloonWrapper"
      className={`${style.balloonLayer} ${isHidden ? style.hidden : ''}`}
    >
      <svg
        width="1"
        height="1"
        id="svg"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        style={{
          position: 'absolute',
          overflow: 'visible',
          top: 0,
          left: 0,
          zIndex: 3,
        }}
      >
        <defs>
          <g id="pop">
            <path
              className="color"
              d="M10.4,1.06s23.25-3.73,31.65,2.8S52,21,52,21s-3.73-11-9.33-10.5-11.47,4.89-11.47,4.89,5.65-11.52,0-11.52-16.55.63-16.55.63Z"
            />
            <path
              className="color"
              d="M31.21,29.08s13,4.36,15.51,0,6.85,0,6.85,0L45.79,46.51S34.84,44.57,33,36.83Z"
            />
            <path
              className="color"
              d="M14.86,6.71l-4,15.14,5.3,3.83s-5.85,3.84-1.43,7.81,13,3.27,13,3.27S-.89,43.33,0,30.93,14.86,6.71,14.86,6.71Z"
            />
          </g>
          <g id="confetti_1">
            <polygon
              className="color"
              points="0 6.23 12.76 0 17.43 6.23 9.96 16.81 0 6.23"
            />
          </g>
          <g id="confetti_2">
            <polygon
              className="color"
              points="0 21.79 10.53 0 15.2 2.18 4.93 25.21 0 21.79"
            />
          </g>
        </defs>
      </svg>
      {floatingBalloons.map((data) => (
        <Balloon
          key={data.balloonId}
          data={data}
          handlePopped={handleBalloonPopped}
        />
      ))}
    </div>
  );
};
export default BalloonLayer;
