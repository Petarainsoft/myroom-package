// import useModal from '@/common/hooks/Modal/useModal';
// import usePopup from '@/common/hooks/Popup/usePopup';
import style from './style.module.scss';
import Button from '@/components/Buttons/Button';
import { useEffect, useState } from 'react';
import LinkPreviewOffCanvas from '../_shared/offcanvas/LinkPreviewOffCanvas';
import useFollowAPI from '@/apis/User/Follow';
import useMe from '@/common/hooks/use-me';

const SYTest = () => {
  // toastPopup 모바일 테스트
  // const StatusMessageEditModal = useModal('StatusMessageEditModal');
  // const [visualViewPort, setVisualViewPort] = useState(0);
  // const [innerHeight, setInnerHeight] = useState(0);
  const [isActiveKeyboard, setIsActiveKeyboard] = useState(false);
  useEffect(() => {
    // StatusMessageEditModal.createModal();
  }, []);

  const handleViewportResize = () => {
    const isKeyboardActive = window.visualViewport!.height < window.innerHeight;
    console.log('키보드 활성화 여부:', isKeyboardActive);
    setIsActiveKeyboard(isKeyboardActive);
  };
  // const { showConfirmPopup } = usePopup();
  window.visualViewport!.onresize = handleViewportResize;

  const [isOpenLinkPreview, setIsOpenLinkPreview] = useState(false);

  const { fetchFollowings } = useFollowAPI();
  const { meProfileId } = useMe();

  const { data } = fetchFollowings({ profile_id: meProfileId! });
  const handleCloseLinkPreview = () => {
    setIsOpenLinkPreview(false);
  };

  return (
    <>
      <div>
        <input />
        <Button className={style.testButton}>버튼</Button>
        <div>{isActiveKeyboard ? '활성' : '비활성'}</div>
      </div>
      <Button
        onClick={() => {
          setIsOpenLinkPreview(true);
        }}
      >
        linkPreview
      </Button>
      <LinkPreviewOffCanvas
        isOpen={isOpenLinkPreview}
        onClose={handleCloseLinkPreview}
        url="https://www.google.com/"
      />
    </>
  );
};

export default SYTest;
