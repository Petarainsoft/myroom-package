import { rest } from 'msw';

const SearchMockList = [
  rest.get('/v1/search/profiles', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.delay(400),
      ctx.json({
        list: [
          {
            _id: 'fVpZxW7pKlcaFLfLjjiBU',
          },
          {
            _id: '9QxhLfwh2SvVYDLdHJTsW',
          },
        ],
        scrollid: 'string',
        t: 0,
        total: 0,
      }),
    );
  }),
  rest.get('/v1/search/market/items', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.delay(400),
      ctx.json({
        list: [
          {
            _id: 'qpmkodKgg7vQjLvfNwA2S',
          },
          {
            _id: '1QiSysVg8St0OBrBr8RHlI',
          },
          {
            _id: '30oEzvPCKJvlr5k4Cqi6pk',
          },
        ],
        scrollid: 0,
        t: 0,
        total: 3,
      }),
    );
  }),
  rest.get('/v1/search/myrooms', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.delay(400),
      ctx.json({
        list: [
          {
            _id: '3lz5LMR1ckgABO8zHY0NE',
          }
        ],
        scrollid: 0,
        t: 0,
        total: 1,
      }),
    );
  }),
];

export default SearchMockList;
