import { rest } from 'msw';

const authMockList = [
    rest.post('/v1/auth/signin/email', (req, res, ctx) => {
        return res(ctx.status(200), ctx.delay(2000), ctx.json({ rooms: [{ id: 1, name: 'test' }] }));
    })
];


export default authMockList;