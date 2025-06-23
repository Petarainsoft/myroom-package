import { IAPIErrorPopup, IToastPopup } from './../../stores/type';
import { useSetAtom } from 'jotai';
import {
  alertPopupAtom,
  confirmPopupAtom,
  goodsPopupAtom,
  toastPopupAtom,
} from '@/common/stores';
import {
  IAlertPopup,
  IConfirmPopup,
  IGoodsPopup as IGoodsPopup,
} from '@/common/stores/type';
import { getLocaleText } from '@/common/utils/text';

const usePopup = () => {
  const setAlertPopupData = useSetAtom(alertPopupAtom);
  const setConfirmPopupData = useSetAtom(confirmPopupAtom);
  const setToastPopupAtom = useSetAtom(toastPopupAtom);
  const setGoodsPopupAtom = useSetAtom(goodsPopupAtom);
  /**
   * @param titleText  제목
   * @param contentText 내용
   * @param confirmText 확인버튼 텍스트
   */
  const showAlertPopup = ({ ...rest }: IAlertPopup) => {
    setAlertPopupData({ ...rest });
  };
  /**
   * @param titleText 제목
   * @param errorText 에러 내용.
   */
  const showAPIErrorPopup = ({
    titleTextId,
    titleText,
    errorText,
  }: IAPIErrorPopup) => {
    let errorElement: string | JSX.Element | JSX.Element[];
    const title = titleTextId
      ? getLocaleText(titleTextId, null, true)
      : titleText;
    if (errorText) {
      errorElement = getLocaleText('GSU.000034', { 0: errorText }, true);
      showAlertPopup({
        titleText: title,
        contentText: errorElement,
      });
    } else {
      showAlertPopup({ titleText: title });
    }
  };

  /**
   * @param titleText  제목
   * @param contentText 내용
   * @param confirmText 확인버튼 텍스트
   * @param cancelText 취소버튼 텍스트
   * @param onConfirm 확인버튼 함수
   */
  const showConfirmPopup = ({ ...rest }: IConfirmPopup) => {
    setConfirmPopupData({ ...rest });
  };
  /**
   * @param titleText  내용
   */
  const showToastPopup = ({ ...rest }: IToastPopup) => {
    console.log(rest);
    setToastPopupAtom({ ...rest });
  };

  const showGoodsPopup = ({ ...rest }: IGoodsPopup) => {
    console.log(rest);
    setGoodsPopupAtom({ ...rest });
  };

  return {
    showAlertPopup,
    showAPIErrorPopup,
    showConfirmPopup,
    showToastPopup,
    showGoodsPopup,
  };
};

export default usePopup;
