import useMarketAPI from '@/apis/Meta/Market';
import { EItemCategory1, EPriceType } from 'client-core';
import { WORLD_ID } from '@/common/constants';
import usePopup from '@/common/hooks/Popup/usePopup';
import Button from '@/components/Buttons/Button';
import useModal from '@/common/hooks/Modal/useModal';
import React from 'react';
import DOMPurify from 'dompurify';
import parse from 'html-react-parser';
import { t } from 'i18next';
import BalloonLayer from '../Room_LEGACY/RoomScene/BalloonLayer';
import View from '../_shared/layouts/View';
// 구매목록 테스트 용 파일 입니다. 작업 완료 후 삭제하겠습니다. - yajin Kim.
const OKIMYJTest = () => {
  const popup = usePopup();
  const productList = useMarketAPI().fetchMarketProducts({
    w: WORLD_ID,
    category: EItemCategory1.MYROOMITEM.toString(),
    selling: true,
  }).data?.list;

  // const productList = [
  //   useMarketAPI().fetchProduct("3lz9Ecqv6iQKwiB3wbykK").data?.data,
  //   useMarketAPI().fetchProduct("5eydLHZ5PPRZNEbH6oOuW").data?.data,
  //   useMarketAPI().fetchProduct("7Xy9bdWtdiQXlBG2b6AQi").data?.data,
  //   useMarketAPI().fetchProduct("9QxcXSGMtUFWxnsmw7NoW").data?.data,
  //   useMarketAPI().fetchProduct("BJxAkg7gyFuqWEg9zkUS0").data?.data,
  //   useMarketAPI().fetchProduct("DCwhcoKpmltRNG8XTXCLI").data?.data,
  //   useMarketAPI().fetchProduct("F5wGYdYo126Iz9TzwCPLc").data?.data,

  //   useMarketAPI().fetchProduct("bjqXskb1UVWxV93HiiCki").data?.data,
  //   useMarketAPI().fetchProduct("2NBOyh6Spw7E5QNaEr4BG4").data?.data,
  // ]
  const CartFullScreenModal = useModal('CartFullScreenModal');
  const BalloonMessageListFullScreenModal = useModal(
    'BalloonMessageListFullScreenModal',
  );
  const BalloonWriteFullScreenModal = useModal('BalloonWriteFullScreenModal');
  const BalloonReadFullScreenModal = useModal('BalloonReadFullScreenModal');
  const LoadingFullScreenModal = useModal('LoadingFullScreenModal');
  const onClickBuy = () => {
    const newList = productList?.slice(0, 10);
    CartFullScreenModal.createModal({
      productList: newList,
    });
  };
  const onClickBalloonList = () => {
    BalloonMessageListFullScreenModal.createModal({});
  };
  const onClickBalloonWrite = () => {
    BalloonWriteFullScreenModal.createModal({});
  };
  const onClickBalloonRead = () => {
    BalloonReadFullScreenModal.createModal({});
  };
  const showAlertPopup = React.useCallback(
    (title: string | JSX.Element | JSX.Element[], error?: string) => {
      let errorElement: JSX.Element;
      if (error) {
        errorElement = parse(
          DOMPurify.sanitize(`${t('GSU.000034', { 0: error })}`),
        ) as JSX.Element;
        popup.showAlertPopup({ titleText: title, contentText: errorElement });
      } else {
        popup.showAlertPopup({ titleText: title });
      }
    },
    [],
  );
  const onClickTestLottie = () => {
    LoadingFullScreenModal.createModal({ limitSec: 5 });
  };
  const what = () => {
    const title = parse(DOMPurify.sanitize(t('GSU.000033').toString()));

    showAlertPopup(title, 'what');
  };

  return (
    <View>
        <Button onClick={onClickBuy}>구매</Button>
        <Button onClick={() => what()} size="l">
          {' '}
          아이디 생성 실패 테스트 팝업
        </Button>
        <Button
          onClick={() => {
            showAlertPopup(
              '죄송합니다. 마이룸 아이디 생성에 실패하여 아이디 생성 화면으로 돌아갑니다.',
              'error message',
            );
          }}
        >
          Alert Popup
        </Button>
        <Button
          onClick={() => {
            popup.showConfirmPopup({
              titleText: '이 페이지에서 나가시겠습니까?',
              contentText: '나가면 편집한 내용이 저장되지 않고 사라집니다.',
            });
          }}
        >
          Confirm Popup
        </Button>
        <Button
          onClick={() => {
            popup.showToastPopup({ titleText: 'toast popup title' });
          }}
        >
          Toast Popup
        </Button>
        <Button
          onClick={() => {
            popup.showGoodsPopup({ priceType: EPriceType.HARDCURRENCY });
          }}
        >
          Goods Popup
        </Button>
        <Button onClick={onClickBalloonList}>풍선 리스트</Button>
        <Button onClick={onClickBalloonRead}>풍선 읽기</Button>
        <Button onClick={onClickBalloonWrite}>풍선 쓰기</Button>
        <Button onClick={onClickTestLottie}>lottie test</Button>

        <BalloonLayer />
    </View>
  );
};

export default OKIMYJTest;
