import Icon from "@/components/Icon";
import style from './style.module.scss';
import Image from "@/components/Image";
import { now } from "@/common/utils/date";
import { t } from "i18next";
import CustomButton from "@/components/Buttons/CustomButton";
import { QRCodeSVG } from "qrcode.react";
import Text from "@/components/Text";

import { CardImageData, CardTextData, CardUIDataBase, IAssetManifest_ProfileCard } from "@/common/jsonTypes/assetManifest_ProfileCard";
const ProfileCard = ({ data, userName, customMessage, avatarImageData, handleNextAvatarAction }: { data: IAssetManifest_ProfileCard, userName:string, customMessage:string, avatarImageData:string, handleNextAvatarAction:()=>void }) => {
  const resourceBasePath = data.main.resourceBasePath??'';
  const InnerImage = ({ data }: { data: CardImageData }) => {
    if (!data || !data.name) return null;
    return (
      <div
        className={style.innerImage}
        style={{
          position: 'absolute',
          left: data.x,
          top: data.y,
          width: data.w,
          height: data.h,
        }}
      >
        {data.name.endsWith('.svg')?<Icon src={`${resourceBasePath}${data.name}`} />:<Image src={`${resourceBasePath}${data.name}`}/>}
      </div>
    );
  };
  const TextUI = ({ data }: { data: CardTextData }) => {
    if (!data) return null;
    let textFormatArgs = {};
    if(data.type === 'account')
      textFormatArgs = {0:(userName ? userName : !data.defaultTextId ? '' : t(data.defaultTextId))};
    else if(data.type === 'date')
      textFormatArgs = {0:now().format('YYYY.MM.DD')};
    else if(data.type === 'edit')
      textFormatArgs = {0:(customMessage ? customMessage :  !data.defaultTextId ? '' : t(data.defaultTextId))};
    return (
      <div
        className={style.innerText}
        style={{
          position: 'absolute',
          left: data.x,
          top: data.y,
          width: data.w,
          height: data.h,
          transform: data.transform,
          fontSize: data.fontSize,
          fontWeight: data.fontWeight,
          transformOrigin: data.transformOrigin,
          textAlign: data.textAlign,
        }}
      >
        <Text locale={{textId:data.textId, values:textFormatArgs}}/>
      </div>
    );
  };
  const QRCode = ({data}:{data:CardUIDataBase})=>{
    if(!data)
      return null;
    return(
      <div className={style.qrCodeWrapper}
      style={{
        position:'absolute',
        left:data.x,
        top:data.y,
        width:data.w,
        height:data.h
      }}
      >
        <QRCodeSVG value='https://myroom.develop.colorver.se/profiles/jHoeCoy2abqXASzd7PLdo' className={style.qrCode}/>
      </div>
    );
  };
  return (
    <div className={style.card}>
      {data.main.background.endsWith('.svg')?<Icon src={`${resourceBasePath}${data.main.background}`} />:<Image src={`${resourceBasePath}${data.main.background}`}/>}
      
      {data.main.imageTransforms?.map((imageData, index) => (
        <InnerImage key={index} data={imageData} />
      ))}
      {data.main.textTransforms?.map((textData, index) => (
        <TextUI key={index} data={textData} />
      ))}
      <CustomButton className={style.btnAvatar} onClick={handleNextAvatarAction}>
        <Image src={`${avatarImageData}`} className={style.avatarImage} />
      </CustomButton>
      <QRCode data={data.main.qrTransform}/>
    </div>
  );
};
export default ProfileCard;