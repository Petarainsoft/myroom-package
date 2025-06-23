import Lottie from 'lottie-react';
import { useEffect, useState } from 'react';
import { BASE_LOTTIE_URL } from '@/common/constants';

export interface LottieProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  baseUrl?: string;
}
const LottieComponent = ({ name, baseUrl, ...rest }: LottieProps) => {
  const [lottieData, setLottieData] = useState('');
  const loadingLottieData = async () => {
    const res = await fetch(
      `${baseUrl ? baseUrl : BASE_LOTTIE_URL}/${name}.json`,
    );
    const json = await res.json();
    setLottieData(json);
  };

  useEffect(() => {
    loadingLottieData();
  }, []);

  return (
    <div {...rest}>
      <Lottie animationData={lottieData} />
    </div>
  );
};
export default LottieComponent;
