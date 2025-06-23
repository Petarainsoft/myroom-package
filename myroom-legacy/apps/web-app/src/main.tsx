import { createRoot } from 'react-dom/client';
import RootRouter from '@/routers';
import { worker } from './mocks/browser';
import Modal from 'react-modal';


if (process.env.NODE_ENV === 'development') {
    worker.start({ quiet: true, onUnhandledRequest: 'bypass' });
}

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<RootRouter />);

Modal.setAppElement('#root');
