
import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import Container from '../../layouts/Container';
import CircleButton from '@/components/Buttons/CircleButton';
import Icon from '@/components/Icon';
import Profile from '../../ui/Profiles/Profile';
import TextArea from '@/components/Forms/TextArea';
import CustomButton from '@/components/Buttons/CustomButton';
import styles from './styles.module.scss';
import useInputHelper from '../../offcanvas/CommentOffCanvas/hooks/use-input-helper';
import Text from '@/components/Text';
import ReactModal from 'react-modal';
import React from 'react';

const CommentInputHelper = () => {
    const { inputHelperState, hideInputHelper } = useInputHelper();

    const [showFrom, setShowFrom] = useState(false);
    const [text, setText] = useState<string>();


    /**
     * 
     */
    const handleClickCloseFrom = useCallback(() => {
        setShowFrom(false);
    }, []);

    /**
     * 
     */
    const handleClick = useCallback(async (e:any) => { 
        e.stopPropagation();
        if (inputHelperState && inputHelperState?.onClick && text) {
            await inputHelperState.onClick(text);
            hideInputHelper();
        } 
    }, [hideInputHelper, inputHelperState, text]);


    /**
     * 
     */
    const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => { 
        setText(e.currentTarget.value);
        

        if (inputHelperState && inputHelperState?.onChange) {
            inputHelperState.onChange(e);
        }
            
    }, [inputHelperState]);


    /**
     * 
     */
    const handleBlur = useCallback((e: any) => { 
        e.stopPropagation();
        if (e.relatedTarget) {
            return;
        }

        hideInputHelper();    
    }, [hideInputHelper]);

    /**
     * 
     */
    const handleFocus = useCallback((e:any) => { 
        if (text) {
            const target = e.currentTarget as HTMLTextAreaElement
            target?.setSelectionRange(text.length, text.length);
        }   
    }, [text]);

    useEffect(() => { 
        if (inputHelperState) {
            if (inputHelperState.text) {
                setText(inputHelperState.text);
            }    

            if (inputHelperState?.nick) {
                setShowFrom(true);
            }
        }


        return () => { 
            setShowFrom(false);
            setText(undefined);
        }
    }, [inputHelperState]);

    return <React.Fragment>
            {inputHelperState &&  <ReactModal
            isOpen={true}
            style={{ overlay: { zIndex: 1080, backgroundColor:'rgba(0, 0, 0, 0.3)' }, content: { zIndex: 1085} }}
            className={styles['wrap']}    
        >
            {showFrom && <Container className={styles['from']}>
                    <Text locale={{ textId: "GMY.000037", values: { 0 : inputHelperState?.nick} }}/>
                <CircleButton size={"s"} shape="none" onClick={handleClickCloseFrom} id={'btn-send'}>
                        <Icon name="Close_Bottom_S"/>
                    </CircleButton>
                </Container>
            }
            <Container className={styles['box']}>
                <Profile size={"xl"} className={styles['profile']} src={inputHelperState?.thumbnail}/>
                <TextArea
                    variant={"primary"}
                    value={text}
                    maxRows={2}
                    minRows={1}
                    buttonOptions={{
                        element: <CustomButton onClick={handleClick}>
                            <Icon name="Send_M" />
                        </CustomButton>
                    }
                    }
                    fixedText={inputHelperState?.mention}
                    onFocus={handleFocus}
                    onBlurCapture={handleBlur}
                    onChange={handleChange}
                    autoFocus
                >   
                </TextArea>
            </Container>
        </ReactModal>}
    </React.Fragment>
};

export default CommentInputHelper;
