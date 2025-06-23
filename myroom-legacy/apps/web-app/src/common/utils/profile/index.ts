import { ProfileResponse } from '@/apis/User/Profile/type';

export const getProfileThumbnail = (
  res: ProfileResponse | null | undefined,
) => {
  if (!res || !res.data) return '';
  return res?.data?.option?.selfie_type === 'image'
    ? res?.data?.resource?.image_selfie
    : res?.data?.resource?.avatar_selfie;
};
