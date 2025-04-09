import style from './style.module.scss';
import Text from '@/components/Text';
import Icon from '@/components/Icon';
import useModal from '@/common/hooks/Modal/useModal';
import { useAtom } from 'jotai';
import { EditedStatusImageAtom } from '@/common/stores';
import usePopup from '@/common/hooks/Popup/usePopup';

const MAX_SIZE = 10;

const ImageUploader = () => {
  const { showToastPopup } = usePopup();
  const ImageCropEditModal = useModal('ImageCropEditModal');
  const [, setEditedStatusImage] = useAtom(EditedStatusImageAtom);

  const onChange = (e: any) => {
    e.preventDefault();
    const file = e.target.files[0];
    const fileSize = file.size; // 파일 크기(Byte)
    // const fileType = file.type;
    const sizeInMB = Number((fileSize / (1024 * 1024)).toFixed(2));

    if (sizeInMB > MAX_SIZE) {
      showToastPopup({
        titleText: (
          <Text
            locale={{ textId: 'GMY.000103' }}
            defaultValue="10mb 이하의 파일만 업로드 가능합니다"
          />
        ),
      });
      return;
    }

    ImageCropEditModal.createModal({
      file,
      onComplete: (file: File) => {
        setEditedStatusImage({
          fileUrl: '',
          file,
        });
      },
    });
  };

  return (
    <>
      <label htmlFor="fileInput">
        <div className={[style.fileUpload].join(' ')}>
          <div className={style.iconWrapper}>
            <Icon name={'ImgUP_S'} />
          </div>
          <Text locale={{ textId: 'GMY.000007' }} />
        </div>
      </label>
      <input
        type="file"
        id="fileInput"
        accept=".jpg, .jpeg, .png"
        onChange={onChange}
        style={{ display: 'none' }}
      />
    </>
  );
};

export default ImageUploader;
