import { rest } from 'msw';
import { BalloonData } from './type';

const balloonsMockList = [
  // 풍선 리스트.
  rest.get('/v1/social/profiles/me/balloons', (req, res, ctx) => {
    console.log('req : ', req.url.search);
    //const limit = parseInt(req.url.searchParams.get('limit') ?? '20');
    const testStart = parseInt(req.url.searchParams.get('testStart') ?? '0');
    const testEnd = parseInt(req.url.searchParams.get('testEnd') ?? '0');
    const testTotal = parseInt(req.url.searchParams.get('testTotal') ?? '0');
    return res(
      ctx.status(200),
      ctx.delay(1000),
      ctx.json({
        count: {
          current: testStart,
          end: testEnd,
          start: testStart,
          total: testTotal,
        },
        list: generateMockData(testStart, testEnd),
      }),
    );
  }),

  rest.post('/v1/social/balloons', (req, res, ctx) => {
    console.log('balloons post : ', req);
    return res(
      ctx.status(200),
      ctx.delay(2000),
      ctx.json({
        _id: '00021527-6fca-69db-4d3b-e49a33000001',
        option: {
          language: 'ko',
          comments_enable: false,
          contents_type: 'text',
          fixed: false,
          show: true,
          version: 1,
        },
        user_id: '00000027-6a9e-862b-6f0b-f0f757000007',
        world_id: '',
        myroom_id: '',
        writer_id: '',
        owner_id: '',
        balloon_id: '',
        balloon_grade: '',
        txt: {
          contents: 'balloon contents',
          hashtag: [],
          title: null,
        },
      }),
    );
  }),
];

const generateMockData = (start: number, end: number): BalloonData[] => {
  const data: BalloonData[] = [];
  // const ids = ['1nLv0BBhp4cWVDhaS3dzKy', '1pEuWSEcqsY9iIO1X6ChXs'];

  for (let i = start; i < end; i++) {
    // const timestamp = Date.now();
    // data.push({
    //   _id: `5eybAEJUm7aPLCeWkTL2u${i}`,
    //   stat: {
    //     created: timestamp,
    //     updated: timestamp,
    //     owner_view: false,
    //   },
    //   balloon_item_grade: '1',
    //   balloon_item_id: ids[Math.floor(Math.random() * ids.length)],
    //   option: {
    //     comments_enable: false,
    //     comments_input_scope: 'all',
    //     contents_type: 'text',
    //     endts: timestamp,
    //     fixed: false,
    //     fixedts: timestamp,
    //     language: 'ko',
    //     show: true,
    //     startts: timestamp,
    //     version: 1,
    //   },
    //   txt: {
    //     contents: `풍선 내용은 유니코드 2000자 까지 허용 - ${i}`,
    //     hashtag: [],
    //   },
    //   writer_profile_id: `7Xy9vFfZDi9tObfwjwAoy`,
    // });
  }

  return data;
};

export default balloonsMockList;
