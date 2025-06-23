import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { BuildConfig, EBuildType } from 'client-core/common/buildConfig.ts'

BuildConfig.initialize(EBuildType.DevTool);

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
