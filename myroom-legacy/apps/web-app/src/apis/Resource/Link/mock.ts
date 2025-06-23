import { rest } from 'msw';

const linkMockList = [
  rest.get('/v1/resource/link', (req, res, ctx) => {
    const linkParam = req.url.searchParams.get('link');
    const decodedLink = decodeURIComponent(linkParam!);
    return res(
      ctx.status(200),
      ctx.delay(2000),
      ctx.json({
        data: {
          _id: '12345',
          option: {
            description: '웹 페이지에 대한 설명입니다.',
            image: 'https://example.com/image.jpg',
            image_height: '60',
            image_width: '80',
            locale: 'en_US',
            site_name: '예시 웹사이트',
            title: '예시 웹 페이지 제목',
            type: 'website',
            // url: 'https://www.google.com/',
            url: decodedLink,
          },
          stat: {
            created: 1631332800,
            updated: 1631400000,
          },
        },
      }),
    );
  }),
];

export default linkMockList;
