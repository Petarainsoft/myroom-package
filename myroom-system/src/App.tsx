import IntegratedApp from './apps/main/IntegratedApp';
import { Toaster } from 'sonner';
import './App.css';

export default function App() {
  return (
    <>
      <IntegratedApp />
      <Toaster position="top-right" richColors />
    </>
  );
}