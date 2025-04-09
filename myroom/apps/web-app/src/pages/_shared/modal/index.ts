import { RetryLazyComponent } from '@/common/utils/common.hooks.ts';
import React from 'react';

const ImageFullScreenModal = React.lazy(() =>
  RetryLazyComponent(() => import('./ImageFullScreenModal')),
);
const StatusMessageEditModal = React.lazy(() =>
  RetryLazyComponent(() => import('./StatusMessageEditModal')),
);
const AvatarInfoFullScreenModal = React.lazy(() =>
  RetryLazyComponent(() => import('./AvatarInfoFullScreenModal/index.tsx')),
);
const TextFullScreenModal = React.lazy(() =>
  RetryLazyComponent(() => import('./TextFullScreenModal')),
);
const ImageCropEditModal = React.lazy(() =>
  RetryLazyComponent(() => import('./ImageCropEditModal')),
);
const CartFullScreenModal = React.lazy(() =>
  RetryLazyComponent(() => import('./CartFullScreenModal')),
);
const ItemFullScreenModal = React.lazy(() =>
  RetryLazyComponent(() => import('./ItemFullScreenModal')),
);
const BalloonMessageListFullScreenModal = React.lazy(() =>
  RetryLazyComponent(
    () => import('./BalloonFullScreenModal/BalloonMessageListFullScreenModal'),
  ),
);
const BalloonWriteFullScreenModal = React.lazy(() =>
  RetryLazyComponent(
    () => import('./BalloonFullScreenModal/BalloonWriteFullScreenModal'),
  ),
);
const BalloonItemSelectFullScreenModal = React.lazy(() =>
  RetryLazyComponent(
    () =>
      import(
        './BalloonFullScreenModal/BalloonWriteFullScreenModal/BalloonItemSelectFullScreenModal'
      ),
  ),
);
const BalloonReadFullScreenModal = React.lazy(() =>
  RetryLazyComponent(
    () => import('./BalloonFullScreenModal/BalloonReadFullScreenModal'),
  ),
);
const MemoCreateModal = React.lazy(() =>
  RetryLazyComponent(() => import('./MemoCreateModal')),
);
const FigureShowcaseModal = React.lazy(() =>
  RetryLazyComponent(() => import('./FigureShowcaseModal')),
);
const FollowFullScreenModal = React.lazy(() =>
  RetryLazyComponent(() => import('./FollowFullScreenModal')),
);
const TagFullScreenModal = React.lazy(() =>
  RetryLazyComponent(() => import('./TagFullScreenModal')),
);
const JoysamModelListModal = React.lazy(() =>
  RetryLazyComponent(() => import('./JoysamModal/JoysamModelListModal')),
);
const JoysamModelInfoModal = React.lazy(() =>
  RetryLazyComponent(() => import('./JoysamModal/JoysamModelInfoModal')),
);
const DialogModal = React.lazy(() =>
  RetryLazyComponent(() => import('./DialogModal')),
);
const JoysamItemDetailModal = React.lazy(() =>
  RetryLazyComponent(() => import('./JoysamModal/JoysamItemDetailModal')),
);
const ProfileFullScreenModal = React.lazy(() =>
  RetryLazyComponent(() => import('./ProfileFullScreenModal')),
);
const LoadingFullScreenModal = React.lazy(() =>
  RetryLazyComponent(() => import('./LoadingFullScreenModal')),
);
const ProfileCardFullScreenModal = React.lazy(() =>
  RetryLazyComponent(() => import('./ProfileCardFullScreenModal')),
);
const ProfileModifyFullScreenModal = React.lazy(() =>
  RetryLazyComponent(() => import('./ProfileModifyFullScreenModal/index.tsx')),
);
const ProfileAccountSettingFullScreenModal = React.lazy(() =>
  RetryLazyComponent(
    () => import('./ProfileAccountSettingFullScreenModal/index.tsx'),
  ),
);
const SettingListFullScreenModal = React.lazy(() =>
  RetryLazyComponent(() => import('./SettingListFullScreenModal/index.tsx')),
);
const SessionListFullScreenModal = React.lazy(() =>
  RetryLazyComponent(() => import('./SessionListFullScreenModal/index.tsx')),
);
const ScrapBookFullScreenModal = React.lazy(() =>
  RetryLazyComponent(() => import('./ScrapBookFullScreenModal/index.tsx')),
);
const WithdrawFullScreenModal = React.lazy(() =>
  RetryLazyComponent(() => import('./WithdrawFullScreenModal/index.tsx')),
);
export {
  ImageFullScreenModal,
  StatusMessageEditModal,
  AvatarInfoFullScreenModal,
  TextFullScreenModal,
  ImageCropEditModal,
  CartFullScreenModal,
  ItemFullScreenModal,
  BalloonMessageListFullScreenModal,
  BalloonWriteFullScreenModal,
  BalloonItemSelectFullScreenModal,
  BalloonReadFullScreenModal,
  MemoCreateModal,
  FigureShowcaseModal,
  FollowFullScreenModal,
  TagFullScreenModal,
  JoysamModelListModal,
  JoysamModelInfoModal,
  DialogModal,
  JoysamItemDetailModal,
  ProfileFullScreenModal,
  LoadingFullScreenModal,
  ProfileCardFullScreenModal,
  ProfileModifyFullScreenModal,
  ProfileAccountSettingFullScreenModal,
  SettingListFullScreenModal,
  SessionListFullScreenModal,
  ScrapBookFullScreenModal,
  WithdrawFullScreenModal,
};
