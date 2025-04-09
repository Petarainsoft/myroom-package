import React, { useCallback, useEffect, useState } from 'react';
import { LogViewer } from '@patternfly/react-log-viewer';
import { useAtom } from 'jotai';
import { logWindowMessageDataAtom } from '../../core/front/stores';
import { Logger } from '../../core/front/logger';
import style from './style.module.scss';
import { EditorConstants } from '@/core/constant';

const LogWindow = () => {
    const [logWindowMessageData,setLogWindowMessageData] = useAtom(logWindowMessageDataAtom);
    const updateLogMessages = useCallback(() => {
        if(Logger.getInstance().needUpdateLogMessages){
            let data = [...logWindowMessageData];
            data = data.concat(Logger.getInstance().getNotAppendedMessage());
            setLogWindowMessageData(data);
            Logger.getInstance().clearNotAppendedMessage();
        }
    },[logWindowMessageData]);

    useEffect(() => {
        const interval = setInterval(() => {
            updateLogMessages();
        }, 300);
        return () => clearInterval(interval);
    }, [updateLogMessages]);

    return (
        <React.Fragment>
            <LogViewer hasLineNumbers= { false} data = {logWindowMessageData.join("\n")} theme = 'dark' scrollToRow={10000}/>
        </React.Fragment>
    );
};

export const registerIpcChannelEventListener_LogWindow = (ipcRenderer:Electron.IpcRenderer) => {
    ipcRenderer.on(EditorConstants.IPC_CHANNEL_LOGGER_LOG,(event,msg,color)=>{
        Logger.log(msg,color||"\x1b[30m");
      });

      ipcRenderer.on(EditorConstants.IPC_CHANNEL_LOGGER_ERROR,(event,msg)=>{
        Logger.error(msg);
      });

      ipcRenderer.on(EditorConstants.IPC_CHANNEL_LOGGER_WARN,(event,msg)=>{
        Logger.warn(msg);
      });
}

export default LogWindow;