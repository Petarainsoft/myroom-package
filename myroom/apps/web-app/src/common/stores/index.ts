import { atom } from 'jotai';
import { ISubCategory, TCategoryMode } from '../utils/json/useCategoryType';
import { MarketProductData } from '@/apis/Meta/Market/type';
import {
  IAlertPopup,
  IConfirmPopup,
  IStatusImage,
  IToastPopup,
  IGoodsPopup,
  TMyCategory,
  THeader,
  TSort,
  TSavePurchase,
  IAvatarInfoMap,
  TStatusActionStep,
  TFollowTabType,
} from './type';
import { ItemCategoriesList } from '@/apis/Meta/ItemCategories/type';
import { ItemData } from '@/apis/Meta/Item/type';
import { eBalloonListUIMode } from '@/pages/_shared/modal/BalloonFullScreenModal/BalloonMessageListFullScreenModal/hooks';
import { BalloonData } from '@/apis/Social/Balloons/type';

type UserStatus = 'UNSIGNED' | 'UNSIGNUP' | 'USER';

//-
export const userStatusAtom = atom<UserStatus>('UNSIGNED');

/** 인증 */
export const isSignedInAtom = atom<boolean | undefined>(undefined); // 이 아톰 사용하건, useAuth 직접접근하여 사용. 직접 로그인 체크하고 로그인 상태가 아닐 때만 false.
export const meAvatarIdAtom = atom<string | null>(null);
export const meProfileIdAtom = atom<string | null>(null);
export const meRoomIdAtom = atom<string | null>(null);
export const meThumnailAtom = atom<string | null>(null);

// export const uriMyRoomIdAtom = atom('');
// export const isOwnRoomAtom = atom(true);
// export const currentRoomProfileIdAtom = atom('');

/** signup */
export const signup_profileNameAtom = atom('');
export const signup_isProfileNameInvalidAtom = atom(false);
export const signup_roomTemplateItemDataAtom = atom<ItemData | null>(null);
export const signup_roomColorAtom = atom('');

/** 배치 된 아이템 헬퍼 */
export const roomObjectAtom = atom<string[]>([]);

/** 아이템 인스턴스 반환 값 */
//export const itemTableAtom = atom<any>({});

/** 저장 */
export const currentMyRoomIdAtom = atom('');
export const currentRoomManifestAtom = atom<any>(undefined);

export const avatarManifestAtom = atom<any>({}); // 아바타 상태창, 꾸미기 등 진입 시 사용하는 아바타 manifest.json
export const avatarInfoMapAtom = atom<IAvatarInfoMap>({}); // 홈화면 아바타, 피규어 클릭 시 모달창 열기 위한 아바타아이디-프로필 아이디 맵
export const uiSavePurchaseModeAtom = atom<TSavePurchase>('S');
export const purchaseItemListAtom = atom<MarketProductData[]>([]);
export const refreshOwnedItemFlagAtom = atom<boolean>(false);

export const avatarEquippedItemAtom = atom<string[]>([]);
export const allPlacedFigureAtom = atom<string[]>([]);
export const allAvatarEquippedItemsAtom = atom<string[]>([]);
export const initialAvatarManifestAtom = atom<any>({});
export const isAvatarSavedAtom = atom(false);

export const initialRoomManifestAtom = atom<any>({});
export const isInitializedRoomSceneAtom = atom<boolean>(false);
export const isAvatarModifiedAtom = atom(false); // 본인 아바타 접근 시, 상태메시지/꾸미기 입장여부

/** 구매목록 */
export const cartProductListAtom = atom<MarketProductData[]>([]);
export const cartUncheckedProductIdsAtom = atom<Record<string, any>>({});

/** 홈화면 UI */
export const uiPlaceModeAtom = atom<boolean>(false);
export const uiPlaceModeSheetSizeAtom = atom(false); // TODO, DynamicSheet에 있는 type 위치변경
export const uiProfileAtom = atom<{ isOpen: boolean; isVisible: boolean }>({
  isOpen: false,
  isVisible: false,
});
export const uiFollowAtom = atom(false);
export const uiAvatarModalAtom = atom(false);
export const uiAppBarAtom = atom(false);
export const uiOnBoardingAtom = atom(false);
export const uiSignInSheetAtom = atom(false); // 로그인 요청 바텀시트
export const uiSignInSheetDimmedAtom = atom(true); // 로그인 요청 바텀 시트 back dimmed.

export const uiHomeZoomInAtom = atom<boolean>(false);

/** 배치모드 - 새로고침 시 체크 */
export const isPlaceModeRefreshedAtom = atom(false);

/** 배치모드 - 스킨 */
export const myRoomBgColorAtom = atom('lightgray');
export const uiBgColorOption = atom(false);

/** 배치모드 배경색 */
export const initialColorIdxAtom = atom<string>('0');

/** 카테고리 데이터  */
export const currentCtgrAtom = atom<ISubCategory>({}); // 현재 서브카테고리
export const currentCtgrKeyAtom = atom<string>('');
export const categoryModeAtom = atom<TCategoryMode>('SKIN');
export const editModeAtom = atom<string>('MARKET');
export const selectedHeaderAtom = atom<THeader>('ITEM');

/** 아이템 */
export const selectedItemAtom = atom(''); // 갤러리에서 클릭시 사용 아이디
export const selectedSkinAtom = atom('');
/** 포인터 컨텍스트 */
export const selectedClientItemAtom = atom(''); // 아이템 내부고유 아이디, 화면 클릭 시 받아옴
export const selectedScreenItemAtom = atom<string[]>([]); // 아이템 내부고유 아이디, 화면 클릭 시 받아옴 / Figure 등 분화
export const selectedScreenItemIdAtom = atom(''); // 3d canvas에서 아이템 선택 후 삭제 시 사용.

export const searchItemListAtom = atom<MarketProductData[]>([]); //
export const marketItemListAtom = atom<MarketProductData[]>([]);
export const myCurrentCtgrAtom = atom<TMyCategory>('COORDI-MY');
export const currentSortTypeAtom = atom<TSort>('all');

/**공통 팝업 */
export const alertPopupAtom = atom<IAlertPopup | null>(null);
export const confirmPopupAtom = atom<IConfirmPopup | null>(null);
export const toastPopupAtom = atom<IToastPopup | null>(null);
export const goodsPopupAtom = atom<IGoodsPopup | null>(null);

/** 아바타 꾸미기 */
export const uiAvatarCustomAtom = atom(false);
export const reqAvatarIdAtom = atom('');
export const reqAvatarVersionAtom = atom<number>(1);

/**상태메시지 */
export const uiAvatarStatusMessageAtom = atom(false);
//상메 아이디
export const currentStatusMessageIdAtom = atom<string>('');

//나의 상태메시지인지
export const isMyStatusMessageAtom = atom<boolean>(false);
export const isFirstStatusMessageAtom = atom<boolean>(false);
//변경한 상메 이미지 (서버 저장 전)
export const EditedStatusImageAtom = atom<IStatusImage | null>(null);
//서버에서 받은 상메 이미지 아이디(수정 가능)
export const copiedStatusImageIdAtom = atom<string>('');
//서버에서 받은 상메 이미지 아이디(수정 X 저장 시 변경사항 체크용)
export const statusImageIdAtom = atom<string>('');
//변경한 상메 텍스트
export const EditedStatusMessageInputAtom = atom<string>('');
//상메 텍스트 변경 모달에서 사용하는 텍스트(임시 저장용)
export const statusMessageTempInputAtom = atom<string>('');
//상메 텍스트 변경 모달 open 유무
export const isOpenMessageInputEditModalAtom = atom<boolean>(false);
//현재 편집 중인 인덱스(이미지, 텍스트)
export const statusEditSlideActiveIndex = atom<number>(0);
//상메 모달 닫기 버튼
export const isClosedStatusMessageModalAtom = atom<boolean>(false);

/**상태메시지 액션 */
export const ActionCategoryListAtom = atom<ItemCategoriesList[]>([]);
// 상태메시지 액션 step
export const actionStepAtom = atom<TStatusActionStep>('_01');
//상메 액션 id
export const statusActionIdAtom = atom<string | null>(null);
export const editedStatusActionIdAtom = atom<string | null>(null);

/**Scene Initialized */
//상태메시지 편집 Scene
export const isAvatarStatusSceneInitializedAtom = atom<boolean>(false);
//상태메시지 모달 Scene
export const isAvatarSceneInitializedAtom = atom<boolean>(false);

//** 풍선 */
export const balloonListUIModeAtom = atom<eBalloonListUIMode>(
  eBalloonListUIMode.View,
);
export const selectedBalloonItemDataAtom = atom<ItemData | undefined>(
  undefined,
);
export const balloonListFilterFlagAtom = atom<number>(0);
export const balloonListOrderByDescAtom = atom<boolean>(true);
export const selectedBalloonMessageListIdsAtom = atom<string[]>([]);
export const createdBalloonDataAtom = atom<BalloonData | undefined>(undefined);
export const needRefetchRoomBalloonsAtom = atom<boolean>(false);
export const notReadBalloonIdsAtom = atom<string[]>([]);
export const isShowBalloonLayerAtom = atom<boolean>(true);
/** 진열장 */
/** 진열장 상태메시지 댓글*/
export const showcaseStatusMessageCommentAtom = atom<{
  targetId: string;
  targetProfileId: string;
}>({ targetId: '', targetProfileId: '' });

/** 진열장 상태메시지 댓글*/
export const showCaseIsCommentOpenAtom = atom<boolean>(false);

interface IMainMainLinkPreviewUI {
  isOpen: boolean;
  url: string;
}
/** main link preview modal */
export const mainLinkPreviewUIlAtom = atom<IMainMainLinkPreviewUI>({
  isOpen: false,
  url: '',
});

/** 팔로우 */
export const followTabAtom = atom<TFollowTabType>('recommend');

export const isAvatarModalOpenAtom = atom(false);
export const isItemModalOpenAtom = atom(false);

/** 조명 */
export const isEnvLightAtom = atom(false);

/** 삭제할것 */
export const uiStatusMsgShowAtom = atom(false);

export const isFigureInfoVisibleAlwaysAtom = atom(true);
