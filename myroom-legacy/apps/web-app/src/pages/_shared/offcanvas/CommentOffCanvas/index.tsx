import OffCanvas from '@/pages/_shared/layouts/Offcanvas';
import CommentHeader from './Header';
import useComment from './hooks';
import CommentItem from './Item';
import style from './styles.module.scss';
import Container from '@/pages/_shared/layouts/Container';
import NotFound from '../../ui/NotFound';
import InputHelper from '../../popup/CommentInputHelper';

interface IComment {
  isOpen: boolean;
  targetId: string;
  targetProfileId: string;
  onClose: () => void;
}

const CommentOffCanvas = ({
  isOpen,
  targetId,
  targetProfileId,
  onClose,
}: IComment) => {


  const { data, totalCount, isLoading, inViewRef, handleClickRefresh } =
    useComment(targetId);

  return (
    <OffCanvas
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[1, 0.9, 431]}
      initialSnap={2}
      headerOptions={{
        customElement: (
          <CommentHeader
            targetId={targetId}
            targetProfileId={targetProfileId}
            count={totalCount}
            handleClickRefesh={handleClickRefresh}
          />
        ),
      }}
      enableFullHeight={true}
    >
      <Container className={style['wrap']}>
        {totalCount > 0 ? (
          <ul className={style['container']}>
            {data?.pages?.map((page) =>
              page?.list?.map((item) => (
                <CommentItem
                  key={item?._id}
                  loading={isLoading}
                  profileId={item.profile_id}
                  contents={item?.txt?.contents}
                  created={item?.stat?.created}
                  commentId={item?._id}
                  targetId={targetId}
                  targetProfileId={targetProfileId}
                />
              )),
            )}
            <li className={style['observer']} ref={inViewRef}></li>
          </ul>
        ) : (
          <NotFound textId='GMY.000140' icon='Allim_Empty1'/>
        )}
      </Container>
      <InputHelper />
    </OffCanvas>
  );
};

export default CommentOffCanvas;
