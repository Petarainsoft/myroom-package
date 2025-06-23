import { useQuery, useMutation } from '@tanstack/react-query'
import { TEvtEnquetesData, TEvtGoodsData } from './type';
import { getChances, postEvtEnquetes, postEvtGoods, postEvtRetweets } from './fetch';
import { instance } from '@/common/utils/axios';

const useEventAPI = () => {

  const queryChances = useQuery(['getChances'], () => getChances(instance), { enabled: false, cacheTime: 0 });
  const mutationEvtRetweets = useMutation(async () => await postEvtRetweets(instance), { cacheTime: 0 });
  const mutationEvtEnquetes = useMutation(async (payload: { params: TEvtEnquetesData }) => await postEvtEnquetes(instance, payload.params), { cacheTime: 0 });
  const mutationEvtGoods = useMutation(async (payload: { params: TEvtGoodsData }) => await postEvtGoods(instance, payload.params), { cacheTime: 0 });

  return { queryChances, mutationEvtEnquetes, mutationEvtGoods, mutationEvtRetweets }
}

export default useEventAPI;

