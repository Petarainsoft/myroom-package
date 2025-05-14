import { useNavigate } from "react-router-dom";
import { useAtomValue, useSetAtom } from "jotai";
import { currentMyRoomIdAtom, followTabAtom, meProfileIdAtom } from "@/common/stores";
import useModal from "@/common/hooks/Modal/useModal";
import useProfileAPI from "@/apis/User/Profile";
import { ProfileCardProps } from "./type";


const useProfileCard = ({ profileId }: ProfileCardProps) => { 
  const setCurrentRoom = useSetAtom(currentMyRoomIdAtom); // 현재 로딩된 마이룸 아이디
  const FollowFullScreenModal = useModal('FollowFullScreenModal');
  const navigate = useNavigate();
  const meProfileId = useAtomValue(meProfileIdAtom);
  const selectedTab = useAtomValue(followTabAtom);


  const { 
    fetchProfileCount, 
    fetchProfile 
  } = useProfileAPI();

  const { data: profileData, isLoading: isProfileLoading } = fetchProfile(profileId);
  const { data: profileCnt } = fetchProfileCount(profileId);

  const handleFollow = () => async () => {
    console.log('handleFollow tab ', selectedTab);
    return false;
  }

  const handleProfileClick = () => {
    // 상단에서 내 프로필일 경우 보여주지 않음
    if(profileData && !profileData.error) {
      console.log('Test ProfileLink ', profileData.data.myroom_id)
      setCurrentRoom(profileData.data.myroom_id ? profileData.data.myroom_id : '');
      navigate(`/rooms/${profileData.data.myroom_id}`);
      FollowFullScreenModal.clearModal();
    }
  };
  
  
  const getIsFollowing = () => {
    return false;
  };
  

  const isFollowing = getIsFollowing() // 팔로잉 여부판단

  return {
    setCurrentRoom,
    FollowFullScreenModal,
    navigate,
    meProfileId,
    selectedTab,
    fetchProfileCount,
    fetchProfile,
    profileData,
    profileCnt,
    handleFollow,
    handleProfileClick,
    isFollowing,
    isProfileLoading
  }
}

export default useProfileCard;