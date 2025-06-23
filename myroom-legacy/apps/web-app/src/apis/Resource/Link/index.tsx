import { getLink } from './fetch';
import { useQuery } from '@tanstack/react-query';
import { instance } from '@/common/utils/axios';
const useLinkAPI = () => {
  const fetchLink = (url: string | undefined) => {
    return useQuery(
      [`fetchProfile`, url],
      async () => await getLink(instance, url!),
      { enabled: !!url },
    );
  };

  return { fetchLink };
};

export default useLinkAPI;
