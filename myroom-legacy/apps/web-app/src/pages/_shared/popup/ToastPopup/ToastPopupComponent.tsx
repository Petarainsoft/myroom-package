import { motion, AnimatePresence } from 'framer-motion';
import './style.scss';
import { useEffect, useState } from 'react';

export interface IToastPopupCore {
  text: string | JSX.Element | JSX.Element[];
  setState: any;
  timeoutMs: number;
}

const ToastPopupCore = ({ text, setState, timeoutMs }: IToastPopupCore) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let timeoutId: any;
    let animationTimeoutId: any;

    if (text) {
      setIsOpen(true);

      animationTimeoutId = setTimeout(() => {
        setIsOpen(false);
      }, timeoutMs);

      timeoutId = setTimeout(() => {
        setIsOpen(false);
        setState(null);
      }, timeoutMs + 1000);
    }

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(animationTimeoutId);
    };
  }, [text, setState, timeoutMs]);

  useEffect(() => {
    console.log('isOpen', isOpen);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%', x: '-50%', opacity: 0 }}
          animate={{ y: 0, x: '-50%', opacity: 1 }}
          exit={{ y: '100%', x: '-50%', opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="toastPopupText"
        >
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ToastPopupCore;
