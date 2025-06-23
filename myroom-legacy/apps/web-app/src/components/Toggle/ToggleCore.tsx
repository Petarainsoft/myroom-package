import React from 'react';
import cx from 'classnames';
import { motion } from 'framer-motion';
import './style.scss';

const spring = {
  type: 'spring',
  stiffness: 700,
  damping: 30,
};

export interface IToggleCore extends React.HTMLAttributes<HTMLDivElement> {
  isActive: boolean;
  handleIsActive: () => void;
}

const ToggleCore = ({ isActive, handleIsActive, className }: IToggleCore) => {
  return (
    <div
      className={cx({ activeToggle: isActive }, 'toggleCoreBtn', className)}
      onClick={handleIsActive}
    >
      <motion.div className="handleBtn" layout transition={spring} />
    </div>
  );
};

export default ToggleCore;
