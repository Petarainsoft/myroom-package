import style from './style.module.scss';
import Item from './Item';
import { useLocation } from 'react-router-dom';

const NaviData = [
  {
    name: 'Myroom',
    path: '/rooms/me',
    txt: 'GCM.000004',
  },
  {
    name: 'Search',
    path: '/search',
    txt: 'GCM.000005',
  },
  {
    name: 'Ping_Make',
    path: '/ping-up',
  },
  {
    name: 'Pings',
    path: '/pings',
    txt: 'GCM.000006',
  },
  {
    name: 'Profile',
    path: '/profile',
    txt: 'GCM.000007',
  },
];

type NavigationProps = {
  isOpen: boolean;
};

const Navigation = ({ isOpen }: NavigationProps) => {
  const location = useLocation();

  return (
    isOpen && (
      <div className={`${style['navigation']}`}>
        {NaviData.map((x) => (
          <Item
            key={x.name}
            name={x.name}
            textId={x.txt}
            goTo={x.path}
            selected={location.pathname.indexOf(x.path) > -1}
          />
        ))}
      </div>
    )
  );
};

export default Navigation;
