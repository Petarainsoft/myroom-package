import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';

export const useMatchRoom = () => {
  const { pathname } = useLocation();

  //현재 Room ID
  const regexRoomId = /\/rooms\/([^/]+)/;
  const match = pathname.match(regexRoomId);

  //현재 Profile ID
  const regexProfileId = /\/profiles\/([^/?]+)/;
  const matchProfileId = pathname.match(regexProfileId);

  const regexIsHome = /^\/home/;
  const isHome = regexIsHome.test(pathname);

  const room_id = match ? match[1] : isHome ? 'me' : null;
  return {
    profileId: matchProfileId && matchProfileId[1],
    isHome,
    room_id,
  };
};

export const useOffCanvasOpenClose = (setIsOpen: any, setIsVisible: any) => {
  const handleOffCanvasOpen = useCallback(() => {
    setIsVisible(true);
    setTimeout(() => {
      setIsOpen(true);
    }, 200);
  }, [setIsOpen, setIsVisible]);

  const handleOffCanvasClose = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      setIsVisible(false);
    }, 200);
  }, [setIsOpen, setIsVisible]);

  return { handleOffCanvasOpen, handleOffCanvasClose };
};

type State = { isOpen: boolean; isVisible: boolean };
type SetStateAction<S> = S | ((prevState: S) => S);
type Dispatch<A> = (value: A) => void;

export const useOffCanvasOpenAndClose = (
  setState: Dispatch<SetStateAction<State>>,
) => {
  const handleOffCanvasOpen = useCallback(() => {
    setState((prev) => ({ ...prev, isVisible: true }));
    setTimeout(() => {
      setState((prev) => ({ ...prev, isOpen: true }));
    }, 200);
  }, [setState]);

  const handleOffCanvasClose = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
    setTimeout(() => {
      setState((prev) => ({ ...prev, isVisible: false }));
    }, 200);
  }, [setState]);

  return { handleOffCanvasOpen, handleOffCanvasClose };
};

export const RetryLazyComponent = async (component: any) => {
  const hasRefreshed = JSON.parse(
    window.sessionStorage.getItem('lazyLoad-Refreshed') || 'false',
  );
  try {
    const ImportComponent = await component();
    window.sessionStorage.setItem('lazyLoad-Refreshed', 'false');
    return ImportComponent;
  } catch (error) {
    if (!hasRefreshed) {
      window.sessionStorage.setItem('lazyLoad-Refreshed', 'true');
      return window.location.reload();
    }
    throw error;
  }
};
