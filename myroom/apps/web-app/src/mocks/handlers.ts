import linkMockList from '@/apis/Resource/Link/mock';
import SearchMockList from '@/apis/Search/mock';
import balloonsMockList from '@/apis/Social/Balloons/mock';

const handlers = [
  ...linkMockList,
  ...balloonsMockList,
  ...SearchMockList,
];

export default handlers;
