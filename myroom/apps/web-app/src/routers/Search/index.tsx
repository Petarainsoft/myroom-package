
import SearchPage from '@/pages/Search';

import { RouteObject } from 'react-router-dom';

const SearchRouter: RouteObject[] = [
    {
        path: 'search',
        element: <SearchPage />,
    },
    {
        path: 'search/:keyword',
        element: <SearchPage />,
    }
];

export default SearchRouter;
