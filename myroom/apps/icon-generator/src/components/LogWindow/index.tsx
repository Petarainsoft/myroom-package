import React, { useCallback, useEffect, useState } from 'react';
import { LogViewer } from '@patternfly/react-log-viewer';
import { useAtom } from 'jotai';
import { logWindowMessageDataAtom } from '@/common/stores';
import { Logger } from '@/common/logger';
import style from './style.module.scss';

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

export default LogWindow;