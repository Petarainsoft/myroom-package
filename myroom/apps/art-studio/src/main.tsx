import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.scss'

import { BuildConfig, EBuildType } from 'client-core/common/buildConfig';
BuildConfig.initialize(EBuildType.DevTool);



ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  //<React.StrictMode>
  <App/>
  //</React.StrictMode>,
)

postMessage({ payload: 'removeLoading' }, '*')
