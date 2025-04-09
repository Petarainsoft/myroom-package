import {
  CSSProperties,
  MouseEvent,
  TouchEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import style from './style.module.scss';
import CustomButton from '@/components/Buttons/CustomButton';
import Image from '@/components/Image';
import { BalloonData } from '@/apis/Social/Balloons/type';
import useBalloonProduct from '@/pages/_shared/modal/BalloonFullScreenModal/Hooks/useBalloonProduct';
import { BALLOON_WIDTH } from '../hooks';
import { ConstantsEx } from 'client-core';
import useBalloonItemTable from '@/pages/_shared/modal/BalloonFullScreenModal/Hooks/useBalloonItemTable';

import gsap from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
gsap.registerPlugin(MotionPathPlugin);

export type FloatingBalloonData = {
  balloonData: BalloonData;
  balloonItemId: string;
  balloonId: string;
  showNewBadge: boolean;
  left: number;
  top: number;
  state: 'idle' | 'appear';
};

const posStyle = (left: number, top: number): CSSProperties => {
  return { left: `${left}px`, top: `${top}px` };
  // return { left: `200px`, top: `${top}px` };
};

const idleAnimationStyle = (): CSSProperties => {
  const duration = Math.ceil(Math.random() * 2);
  const direction =
    Math.ceil(Math.random() * 1) > 0 ? 'alternate' : 'alternate-reverse';
  return {
    animationDuration: `${duration}s`,
    animationDirection: direction,
  };
};
const appearAnimationStyle = (): CSSProperties => {
  return {};
};

const Balloon = ({
  data,
  handlePopped,
}: {
  data: FloatingBalloonData;
  handlePopped: (data: FloatingBalloonData) => void;
}) => {
  const { balloonResource } = useBalloonProduct(
    data.balloonData.balloon_item_id,
  );
  const { letterBG } = useBalloonItemTable(data.balloonData.balloon_item_id);

  const maxWidth = parseInt(
    document.documentElement.style.getPropertyValue('--max-width'),
  );
  const leftWindowMargin = Math.max(0, window.innerWidth - maxWidth) / 2;

  const isIdle = data.state == 'idle';
  const stateStyleName = style[data.state];
  // const confettiColors = ['#FF0074', '#FFF200', '#C300FF', '#C97BE1', '#E17B90'];
  const getColor = () => {
    return (
      'hsl(' +
      360 * Math.random() +
      ',' +
      (100 + 70 * Math.random()) +
      '%,' +
      (70 + 0 * Math.random()) +
      '%)'
    );
  };

  const popBalloon = async (x: number, y: number) => {
    const balloon = document.getElementById(BalloonID);
    if (!balloon) {
      return;
    }
    const balloonPos = balloon.getBoundingClientRect();
    x = balloonPos.x - leftWindowMargin + BALLOON_WIDTH / 4;
    y = balloonPos.y;
    const originClasses = balloon.getAttribute('class') ?? '';
    const newClasses = originClasses + ` ${style.popped}`;
    balloon.setAttribute('class', newClasses);

    const svg = document.getElementById('svg');
    console.log('popBalloon - ', svg);
    // const balloon = document.getElementById(BalloonID);
    if (!svg) {
      return;
    }

    const pop = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    pop.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#pop');
    pop.setAttribute('style', `fill: ${letterBG}`);
    pop.setAttribute('class', `pop`);

    svg.appendChild(pop);

    gsap.set(pop, {
      scale: 0.5,
      x: x,
      y: y,
      rotation: Math.random() * 360,
      transformOrigin: 'center',
    });
    gsap.to(pop, {
      duration: 0.2,
      scale: 3,
      opacity: 0,
      ease: 'power3.out',
      onComplete: () => {
        svg.removeChild(pop);
      },
    });
    const balloonHalfWidth = BALLOON_WIDTH / 2;
    const pos = [
      [-balloonHalfWidth, balloonHalfWidth],
      [0, balloonHalfWidth],
      [balloonHalfWidth, balloonHalfWidth],
      [-balloonHalfWidth, 0],
      [0, 0],
      [balloonHalfWidth, 0],
      [-balloonHalfWidth, -balloonHalfWidth],
      [0, -balloonHalfWidth],
      [balloonHalfWidth, -balloonHalfWidth],
    ];
    for (let i = 0; i < pos.length; i++) {
      // const randomPos = {
      //   x: Math.random() * 500 - 250,
      //   y: Math.random() * 500 - 250,
      // };

      const randomPosX = pos[i][0] + balloonHalfWidth / 2; //pos[i][0];
      const randomPosY = pos[i][1];
      const confetti = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'use',
      );
      confetti.setAttributeNS(
        'http://www.w3.org/1999/xlink',
        'xlink:href',
        `#confetti_${Math.ceil(Math.random() * 2)}`,
      );
      // confetti.setAttribute('style', `fill: ${getRandomColorFromPalette('#cb27ec')}`);
      confetti.setAttribute('style', `fill: ${getColor()}`);
      confetti.setAttribute('class', `confetti`);

      svg.appendChild(confetti);

      gsap.set(confetti, {
        x: x,
        y: y,
        rotation: Math.random() * 360,
        transformOrigin: 'center',
      });
      gsap.to(confetti, {
        duration: 3,
        scale: Math.random(),
        motionPath: {
          curviness: 2,
          path: [
            {
              x: x + randomPosX,
              y: y + randomPosY,
            },
            {
              x: x + randomPosX + (Math.random() * 20 - 10),
              y: y + randomPosY + Math.random() * 200,
            },
          ],
        },
        opacity: 0,
        rotation: Math.random() * 360 - 180,
        ease: 'power4.out',
        onComplete: () => {
          svg.removeChild(confetti);
        },
      });
    }
    setTimeout(() => {
      balloon.setAttribute('class', originClasses);
      handlePopped(data);
    }, 500);
  };

  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    popBalloon(e.clientX - leftWindowMargin, e.clientY - BALLOON_WIDTH / 2);
    // pop();
  };

  const balloonRoot = useRef<HTMLDivElement>(null);
  const [touchTimeStamp, setTouchTimeStamp] = useState(-1);
  const onTouchStart = useCallback(
    (e: TouchEvent<HTMLButtonElement>) => {
      setTouchTimeStamp(e.timeStamp);
    },
    [setTouchTimeStamp],
  );
  const onTouchEnd = useCallback(() => {
    setTouchTimeStamp(-1);
  }, [setTouchTimeStamp]);
  const onTouchMove = useCallback(
    (e: TouchEvent<HTMLButtonElement>) => {
      if (touchTimeStamp == -1) return;
      if (e.timeStamp - touchTimeStamp < 500) {
        setTouchTimeStamp(-1);
        return;
      }
      const left = e.touches[0].clientX - leftWindowMargin - BALLOON_WIDTH / 2;
      const top = e.touches[0].clientY - BALLOON_WIDTH;
      setBalloonPos(left, top);
    },
    [touchTimeStamp],
  );

  const setBalloonPos = (left: number, top: number) => {
    if (!balloonRoot || !balloonRoot.current) return;
    left = Math.max(
      -(BALLOON_WIDTH / 4),
      Math.min(
        left,
        window.innerWidth - leftWindowMargin * 2 - BALLOON_WIDTH * 0.75,
      ),
    );
    top = Math.max(
      -(BALLOON_WIDTH / 4),
      Math.min(top, window.innerHeight - BALLOON_WIDTH * 1.75),
    );
    balloonRoot.current.style.left = `${left}px`;
    balloonRoot.current.style.top = `${top}px`;
  };

  const animation = useRef<HTMLDivElement>(null);
  const BalloonRootID = `${style.balloonRoot}_${data.balloonData._id}`;
  const BalloonID = `${style.balloon}_${data.balloonData._id}`;
  const BalloonButton = useMemo(() => {
    return (
      <CustomButton
        onClick={onClick}
        value={data.balloonData._id}
        onTouchStart={ConstantsEx.isMobile() ? onTouchStart : () => {}}
        onTouchEnd={ConstantsEx.isMobile() ? onTouchEnd : () => {}}
        onTouchMove={ConstantsEx.isMobile() ? onTouchMove : () => {}}
      >
        <Image src={balloonResource} />
      </CustomButton>
    );
  }, [onClick, onTouchStart, onTouchEnd, onTouchMove, data, balloonResource]);
  return (
    <div
      id={BalloonRootID}
      className={style.balloonRoot}
      style={posStyle(data.left, data.top)}
      ref={balloonRoot}
    >
      <div
        id={BalloonID}
        ref={animation}
        className={`${style.balloon} ${stateStyleName}`}
        style={isIdle ? idleAnimationStyle() : appearAnimationStyle()}
      >
        {BalloonButton}
      </div>
    </div>
  );
};
export default Balloon;
