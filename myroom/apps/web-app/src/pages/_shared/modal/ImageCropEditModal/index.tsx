import { Modal, ModalProps } from '@/components/_core/ModalCore';
import './style.scss';
import Icon from '@/components/Icon';
import Text from '@/components/Text';
import Cropper, { Area } from 'react-easy-crop';
import { useEffect, useCallback, useState, useRef } from 'react';
import getCroppedImg, {
  dataURLtoFile,
} from '@/common/hooks/Cropper/getCroppedImg';
import CustomButton from '@/components/Buttons/CustomButton';
interface IImageCropEditModal extends Omit<ModalProps, 'onRequestClose'> {
  file: File;
  onComplete: (file?: File) => Promise<void> | void;
}

const ImageCropEditModal = ({
  // handleClose,
  file,
  onComplete,
  onRequestClose,
}: IImageCropEditModal) => {
  const inputRangeRef = useRef<HTMLInputElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);
  const [cropImgUrl, setCropImgUrl] = useState<string>('');
  const [currentRatio, setCurrentRatio] = useState(1 / 1);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area>();
  const [, setCropSize] = useState({ width: 0, height: 0 });
  const [, setMediaSize] = useState({
    width: 0,
    height: 0,
    naturalWidth: 0,
    naturalHeight: 0,
  });

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const onSaveImage = async () => {
    if (!croppedAreaPixels) return;
    try {
      const croppedImage = (await getCroppedImg(
        cropImgUrl,
        croppedAreaPixels,
      )) as string;
      if (!croppedImage) return;

      onComplete(dataURLtoFile(croppedImage, 'image.png'));

      // setEditedImage({
      //   fileUrl: '',
      //   file: ,
      // });
      onRequestClose();
    } catch (e) {
      console.error(e);
    }
  };

  //비율변화
  const onChangeRatio = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentRatio(parseFloat(e.target.value));
  };

  const ratioList = [
    { id: 'radio1', value: 1 / 1, label: '1:1' },
    { id: 'radio2', value: 3 / 4, label: '3:4' },
    { id: 'radio3', value: 4 / 3, label: '4:3' },
    // 추가적인 비율을 필요한 만큼 배열에 추가할 수 있습니다.
  ];

  const onChangeInputRange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoom(Number(e.target.value));
    console.log('e.target.value', e.target.value);
  };

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => {
      if (!reader.result) return;
      setCropImgUrl(reader.result.toString());
      // setEditedStatusImage({ fileUrl: reader.result.toString(), file });
    };
    reader.readAsDataURL(file);
  }, []);

  const displayValue = () => {
    return Math.ceil(zoom * 50) - 50;
  };

  useEffect(() => {
    const value = Number(displayValue());
    if (inputRangeRef.current) {
      inputRangeRef.current.style.backgroundImage =
        'linear-gradient(to right, #DBFC3D 0%, #DBFC3D ' +
        value +
        '%, #EEEEEE ' +
        value +
        '%, #EEEEEE 100%)';
    }
    if (zoomRef.current) {
      zoomRef.current.style.transform = 'translateX(' + value + '%)';
    }
  }, [zoom]);

  return (
    <Modal isOpen={true} styles={{ overlay: { backgroundColor: 'black' } }}>
      <div className={'imageCropEditModalWrapper'}>
        <div className={'buttonWrapper'}>
          <CustomButton className={'cancel'} onClick={onRequestClose}>
            <Icon name="Top_Arrow_left_M" />
          </CustomButton>
          <CustomButton className={'confirm'} onClick={onSaveImage}>
            <Text locale={{ textId: 'GCM.000003' }} defaultValue="확인" />
          </CustomButton>
        </div>
        <div className="cropperContainer">
          <Cropper
            image={cropImgUrl}
            crop={crop}
            zoom={zoom}
            aspect={currentRatio}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            setMediaSize={setMediaSize}
            setCropSize={setCropSize}
            // objectFit="contain"
          />
        </div>
        <div className="aspectRatioSelectorWrapper">
          <div className="aspectRatioSelector" onChange={onChangeRatio}>
            {ratioList.map((ratio) => (
              <label
                key={ratio.id}
                htmlFor={ratio.id}
                className={`ratioButton ${
                  currentRatio === ratio.value ? 'isActive' : ''
                }`}
              >
                <input
                  type="radio"
                  id={ratio.id}
                  value={ratio.value}
                  name="radio"
                />
                {ratio.label}
              </label>
            ))}
          </div>
        </div>
        <div className="controller">
          <div ref={zoomRef} className="zoomRangeNum">
            <div className="zoomNumWrapper">{displayValue()}</div>
          </div>
          <input
            type="range"
            ref={inputRangeRef}
            value={zoom}
            min={1}
            max={3}
            step={0.02}
            aria-labelledby="Zoom"
            onChange={onChangeInputRange}
            className="zoomRange"
          />
        </div>
      </div>
    </Modal>
  );
};

export default ImageCropEditModal;
