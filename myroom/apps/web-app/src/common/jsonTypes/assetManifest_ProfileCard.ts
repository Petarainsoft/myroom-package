import { IAssetManifest } from "client-core/assetSystem/jsonTypes/manifest/assetManifest";
import { Property } from 'csstype';
export type CardUIDataBase = {
  x: number;
  y: number;
  w: number | string;
  h: number | string;
};
export type CardImageData = CardUIDataBase & {
  name: string;
};
export type CardTextData = CardUIDataBase & {
  textId: string;
  type:'account'|'date'|'edit';
  defaultTextId?:string;
  transform?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: Property.TextAlign;
  transformOrigin?: string;
};
export type CardData = {
  background: string;
  imageTransforms: CardImageData[];
  textTransforms: CardTextData[];
  qrTransform: CardUIDataBase;
};
export interface IAssetManifest_ProfileCard extends IAssetManifest {
    format: number;
    main:
    {
        type: string,
        background: string,
        imageTransforms: CardImageData[],
        textTransforms: CardTextData[],
        qrTransform: CardUIDataBase,
        resourceBasePath?:string,        // server에서 데이터 받아올 때 thumbnail 을 활용해서 생성한다. json file에는 없음.
    };
}