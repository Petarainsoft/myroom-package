import linkMockList from '@/apis/Resource/Link/mock';
import SearchMockList from '@/apis/Search/mock';
import balloonsMockList from '@/apis/Social/Balloons/mock';
import authMockList from '@/apis/User/Auth/mock';
import FollowMockList from '@/apis/User/Follow/mock';

const handlers = [
  ...authMockList,
  ...linkMockList,
  ...balloonsMockList,
  ...FollowMockList,
  ...SearchMockList,
];

export default handlers;
