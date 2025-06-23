
import RoomPage from '@/pages/RoomPage';
import Main from '@/pages/RoomPage/Main';
import Place from '@/pages/RoomPage/Place';
import { RouteObject } from 'react-router-dom';

const RoomRouter: RouteObject[] = [
    {
        path: 'rooms',
        element: <RoomPage />,
        children: [
          {
            index: true,
            path:':target',
            element: <Main />,
            
          },
          {
            path:':target/place',
            element: <Place />,
          },
        ],
      },
];

export default RoomRouter;
