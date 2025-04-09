import { useQuery } from '@tanstack/react-query';
import { instance } from '@/common/utils/axios';
import { RecommendationMyroomParams } from './type';
import { 
  getRecommendationMyRoom,
  getRecommendationMeFollowers,
  getRecommendationFollowers
} from './fetch';
import useAuth from '@/common/hooks/use-auth';

const useRecommendationAPI = () => {
  const { isLogined } = useAuth();

  /**
   * 마이룸 추천 리스트
   * @param params
   * @returns
   */
  const fetchRecommendationMyroom = (params: RecommendationMyroomParams) => {
    return useQuery(
      [`fetchRecommendationMyroom`, params],
      async () => await getRecommendationMyRoom(instance, params),
    );
  };

  const fetchRecommendationMeFollowers = () => {
    return useQuery(
      [`fetchRecommendationMeFollowers`],
      async () => await getRecommendationMeFollowers(instance),
      { enabled: isLogined },
    );
  };
  
  const fetchRecommendationFollowers = (profileId: string) => {
    return useQuery(
      [`fetchRecommendationFollowers`, profileId],
      async () => await getRecommendationFollowers(instance, profileId),
      { enabled: isLogined },
    );
  };

  return {
    fetchRecommendationMyroom,
    fetchRecommendationMeFollowers,
    fetchRecommendationFollowers
  };
};

export default useRecommendationAPI;
