import Auth from '@/pages/Auth';
import _Callback from '@/pages/Auth/_Callback';
import Signin from '@/pages/Auth/Signin';
import TestSignin from '@/pages/Auth/TestSignin';
import Signup from '@/pages/Auth/Signup';
import Room from '@/pages/Auth/Signup/Room';
import Terms from '@/pages/Auth/Signup/Terms';
import { RouteObject } from 'react-router-dom';

const AuthRouter: RouteObject[] = [
  {
    path: 'auth',
    element: <Auth />,
    children: [
      {
        path: '_callback',
        element: <_Callback />,
      },
      {
        path: 'signin',
        element: <Signin />,
      },
      {
        path: 'test-signin',
        element: <TestSignin />,
      },
      {
        path: 'signup',
        element: <Signup />,
        children: [
          {
            path:'',
            element:<Terms/>,
          },
          {
            path:'room',
            element:<Room/>,
          },
        ],
      },
    ],
  },
];

export default AuthRouter;
