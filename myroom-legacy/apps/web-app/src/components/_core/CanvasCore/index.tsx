import { CanvasHTMLAttributes } from 'react';

const CanvasCore = (props: CanvasHTMLAttributes<HTMLCanvasElement>) => {
  return <canvas {...props}></canvas>;
};

export default CanvasCore;
