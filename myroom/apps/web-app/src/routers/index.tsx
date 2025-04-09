import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from '@/App';
import Init from '@/pages/Init';
import Error from '@/pages/Error';
import AuthRouter from './Auth';
import SearchRouter from './Search';
import RoomRouter from './Room';
import OKIMYJTest from '@/pages/OKIMYJTest';
import SYTest from '@/pages/SYTest';
import Joysam from '@/pages/Joysam';
import KHConv from '@/pages/KHHome/KHConv';
import ProfilePage from '@/pages/ProfilePage';
import FigureShowcase from '@/pages/FigureShowcase';
import DialogPage from '@/pages/Joysam/DialogPage';
import { Suspense } from 'react';
import Avatar from '@/pages/Avatar';
import KHHome from '@/pages/KHHome';
import KHLobby from '@/pages/KHHome/KHLobby';
import KHFitness from '@/pages/KHHome/KHFitness';
import ProfileAccountSettingPage from '@/pages/ProfileAccountSettingsPage';
import KHTherapy from '@/pages/KHHome/KHTherapy';
import ScrapBookPage from '@/pages/ScrapBookPage';
import ProfileCardTestPage from '@/pages/TestPages/ProfileCardTestPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <App outlet={<Error />} />,
    children: [
      {
        index: true,
        element: <Init />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'profileAccountSetting',
        element: <ProfileAccountSettingPage />,
      },
      {
        path: 'scrapBook',
        element: <ScrapBookPage />,
      },
      {
        path: 'profiles/:id',
        element: <ProfilePage />,
      },
      {
        path: 'figure-showcase/:id',
        element: <FigureShowcase />,
      },
      {
        path: 'profileCardTest',
        element: <ProfileCardTestPage />,
      },
      {
        path: 'okimyj',
        element: <OKIMYJTest />,
      },
      {
        path: 'sy',
        element: <SYTest />,
      },
      {
        path: 'joysam',
        element: <Joysam />,
      },
      {
        path: 'joysam-dialog-test',
        element: <DialogPage />,
      },
      {
        path: 'kh',
        element: <KHHome />,
      },
      {
        path: 'khconv',
        element: <KHConv />,
      },
      {
        path: 'khlobby',
        element: <KHLobby />,
      },
      {
        path: 'khfitness',
        element: <KHFitness />,
      },
      {
        path: 'khtherapy',
        element: <KHTherapy />,
      },
      {
        path: 'avatar',
        element: <Avatar />,
      },
      ...AuthRouter,
      ...SearchRouter,
      ...RoomRouter,
    ],
  },
]);

const RootRouter = () => {
  return (
    <Suspense fallback={<></>}>
      <RouterProvider router={router} />
    </Suspense>
  );
};

export default RootRouter;
