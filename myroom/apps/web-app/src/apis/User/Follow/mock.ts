import { rest } from 'msw';

const followList = [
  {
    _id: 'fVpZxW7pKlcaFLfLjjiBU',
  },
  {
    _id: '9QxhLfwh2SvVYDLdHJTsW',
  },
  {
    _id: 'GyvnMtqxyH8ZE3MCbxGFc',
  },
  {
    _id: 'DCwkMHtpVMvlsDCV9oPjM',
  },
  {
    _id: 'BJxCvrchgcSICJZNwlfaS',
  },
  {
    _id: 'F5wFwTZq9WGyYxQhBl8fQ',
  },
  {
    _id: '3lz86KRvHQpt1ycqjcRjE',
  },
  {
    _id: '3lz6E9UgSsjBxekgTSI6K',
  },
  {
    _id: 'BJxFdRC8LcjMUWZ5AO7rE',
  },
];
const followMeList = [
  {
    _id: 'fVpZxW7pKlcaFLfLjjiBU',
  },
  {
    _id: '9QxhLfwh2SvVYDLdHJTsW',
  },
  {
    _id: 'GyvnMtqxyH8ZE3MCbxGFc',
  },
];

const repeatArray = (arr: { _id: string }[], times: number) => {
  let result: { _id: string }[] = [];
  for (let i = 0; i < times; i++) {
    result = result.concat(arr);
  }
  return result;
};

const FollowMockList = [
  rest.get('/v1/user/profiles/:profile_id/followers', (req, res, ctx) => {
    const page = Number(req.url.searchParams.get('page')) || 1;
    const limit = Number(req.url.searchParams.get('limit')) || 30;
    const startIdx = (page - 1) * limit;
    const endIdx = startIdx + limit;
    const mockData = repeatArray(followList, 16);
    const paginatedData = mockData.slice(startIdx, endIdx);
    if (req.params.profile_id === 'me') {
      return res(
        ctx.status(200),
        ctx.delay(1000),
        ctx.json({
          count: {
            current: 0,
            limit: 30,
            page: 1,
            total: 0,
          },
          list: [followMeList],
        }),
      );
    }
    return res(
      ctx.status(200),
      ctx.delay(1000),
      ctx.json({
        count: {
          current: 1,
          limit: 30,
          page: 1,
          total: 1,
        },
        list: [paginatedData],
      }),
    );
  }),
  rest.get('/v1/user/profiles/:profile_id/follows', (req, res, ctx) => {
    const page = Number(req.url.searchParams.get('page')) || 1;
    const limit = Number(req.url.searchParams.get('limit')) || 30;
    const startIdx = (page - 1) * limit;
    const endIdx = startIdx + limit;
    const mockData = repeatArray(followList, 16);
    const paginatedData = mockData.slice(startIdx, endIdx);
    if (req.params.profile_id === 'me') {
      return res(
        ctx.status(200),
        ctx.delay(1000),
        ctx.json({
          count: {
            current: 0,
            limit: limit,
            page: page,
            total: 0,
          },
          list: [followMeList],
        }),
      );
    }
    return res(
      ctx.status(200),
      ctx.delay(1000),
      ctx.json({
        count: {
          current: 1,
          limit: 30,
          page: 1,
          total: 1,
        },
        list: [paginatedData],
      }),
    );
  }),
  rest.put('/v1/user/profiles/me/follows/:profile_id', (req, res, ctx) => {
    return res(ctx.status(200), ctx.delay(400), ctx.json({}));
  }),
  rest.delete('/v1/user/profiles/me/follows/:profile_id', (req, res, ctx) => {
    return res(ctx.status(200), ctx.delay(400), ctx.json({}));
  }),
];

export default FollowMockList;
