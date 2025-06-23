import {
  EItemCategory1Depth,
  EItemCategory2Depth,
  EItemCategory3Depth,
} from './EItemCategory';
import {
  ICategory,
  IMainCategory,
  ISubCategory,
} from './useCategoryType';

/** Todo:
 * CDN에 json 프리셋이 올라가서 해당 파일 다운로드에서 사용예정.
 * 최초 다운로드 이후 IndexedDB 에 저장하여 캐싱
 */

export const superCategory: ICategory = EItemCategory1Depth;
export const mainCategory: IMainCategory = EItemCategory2Depth;
export const subCategory: ISubCategory = EItemCategory3Depth;

export const avaCategory: ISubCategory = {};
Object.entries(subCategory).map(ctgr => {
  const ctgrKey = Number(ctgr[0]);
  if (ctgrKey < 120000) avaCategory[ctgr[0]] = ctgr[1];
});
avaCategory['11'] = { Name: 'ALL', Text: '아바타 전체', Desc: '', Parent: '', ActiveIcon: 'accSelectedIcon', InActiveIcon: 'cate-all', IsShowShop: true }

export const skinCategory: ISubCategory = {};
Object.entries(subCategory).map(ctgr => {
  const ctgrKey = Number(ctgr[0]);
  if (120000 <= ctgrKey && ctgrKey < 130000) skinCategory[ctgr[0]] = ctgr[1];
});
skinCategory['12'] = { Name: 'ALL', Text: '스킨 전체', Desc: '', Parent: '', ActiveIcon: 'accSelectedIcon', InActiveIcon: 'cate-all', IsShowShop: true }

export const itemCategory: ISubCategory = {};
Object.entries(subCategory).map(ctgr => {
  const ctgrKey = Number(ctgr[0]);
  if (130000 <= ctgrKey) itemCategory[ctgr[0]] = ctgr[1];
});
itemCategory['13'] = { Name: 'ALL', Text: '아이템 전체', Desc: '', Parent: '', ActiveIcon: 'accSelectedIcon', InActiveIcon: 'cate-all', IsShowShop: true }

