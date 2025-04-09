import React from 'react';
import usePopup from '@/common/hooks/Popup/usePopup';
import NotFound from '@/pages/_shared/ui/NotFound';

interface ItemNone {
  isMe: boolean;
}

const ItemNone = ({ isMe }: ItemNone) => {
  const { showToastPopup } = usePopup();
  return (<React.Fragment>
    {isMe ? <NotFound icon='Allim_Empty1' textId='GPF.000016' action={{ textId: "GMY.000115", onClick: () => showToastPopup({ titleText: '준비 중입니다.' }) }} /> :
      <NotFound icon='Allim_Empty1' textId='GPF.000015' />}
    </React.Fragment>
    
    // <div className={style.figureItemNoneWrapper}>
    //   <div className={style.iconWrapper}>
    //     <Icon name="Allim_Empty1" />
    //   </div>
    //   <Text
    //     locale={{
    //       textId: 'GPF.000015',
    //     }}
    //     defaultValue="피규어 진열장이 비어 있습니다."
    //   />
    //   {isMe && (
    //     <>
    //       <br />
    //       <Text
    //         locale={{
    //           textId: 'GPF.000016',
    //         }}
    //         defaultValue="다른 사용자를 팔로우하여 피규어를 만들어보세요."
    //       />
    //       <Button
    //         size="l"
    //         className={style.recommendBtn}
    //         onClick={() => showToastPopup({ titleText: '준비 중입니다.' })}
    //       >
    //         <Text
    //           locale={{
    //             textId: 'GMY.000115',
    //           }}
    //           defaultValue="사용자 추천 보기"
    //         />
    //       </Button>
    //     </>
    //   )}
    // </div>
  );
};

export default ItemNone;
