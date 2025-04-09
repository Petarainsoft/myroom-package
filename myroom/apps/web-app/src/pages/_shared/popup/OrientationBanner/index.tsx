import { useState, useEffect, useMemo } from 'react';
import style from './style.module.scss';
import { motion } from 'framer-motion';
import Icon from '@/components/Icon';
import Text from '@/components/Text';
import debounce from 'lodash/debounce';

const variants = {
  hidden: { y: '-100%' },
  visible: { y: '0%' },
};

const OrientationBanner = () => {
  const [isLandscape, setIsLandscape] = useState<null | boolean>(null);
  const isMobile = useMemo((): boolean => {
    const userAgent =
      typeof window.navigator === 'undefined' ? '' : navigator.userAgent;
    return Boolean(
      userAgent.match(
        /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i,
      ),
    );
  }, []);

  useEffect(() => {
    if (!isMobile) return;

    const checkOrientation = (): boolean => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const ratio = width / height;
      const tolerance = 0.45;

      const isPortrait = Math.abs(ratio - 1) <= tolerance;
      if (isPortrait || (width > 840 && height > 1000)) {
        return false;
      }
      return width > height;
    };

    const handleResize = debounce(() => {
      setIsLandscape(checkOrientation());
    }, 150);

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    isLandscape &&
    isMobile && (
      <motion.div
        className={style.orientationBannerWrapper}
        initial="hidden"
        animate={isLandscape ? 'visible' : 'hidden'}
        variants={variants}
      >
        <div className={style.flex}>
          <Icon name="Orientation_S" />
          <div className={style.text}>
            <Text
              locale={{
                textId:
                  '화면을 세로로 돌리면 서비스를 더 쾌적하게 이용하실 수 있어요.',
              }}
              defaultValue="화면을 세로로 돌리면 서비스를 더 쾌적하게 이용하실 수 있어요."
            />
          </div>
        </div>
      </motion.div>
    )
  );
};

export default OrientationBanner;
