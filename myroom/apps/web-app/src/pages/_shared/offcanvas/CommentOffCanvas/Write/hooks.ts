import { ChangeEvent, useCallback, useMemo, useRef, useState } from "react";
import useCommentAPI from "@/apis/Social/Comment";
import { useNavigate } from "react-router-dom";
import useAuth from "@/common/hooks/use-auth";
import useProfileAPI from "@/apis/User/Profile";
import useMe from "@/common/hooks/use-me";
import useInputHelper from "../hooks/use-input-helper";
import { ConstantsEx } from "client-core/assetSystem/constantsEx";


type useCommentWriteProps = {
    initComment: string;
    targetId: string;
    targetProfileId: string;
    parentId?: string;
    commentId?: string;
    parentProfileId?: string;
    mention?: boolean;
    handleAfterSubmit?: () => void;
    handleClickEditCancel?: () => void;
}

const useCommentWrite = ({
    initComment,
    targetId,
    targetProfileId,
    parentId,
    commentId,
    parentProfileId,
    mention,
    handleAfterSubmit,
    handleClickEditCancel
}: useCommentWriteProps) => {
    const { showInputHelper} = useInputHelper();
    const { isLogined } = useAuth();
    const { meThumbnail } = useMe();


    const { mutationPostComments, mutationPatchComment } = useCommentAPI();
    const { fetchProfile } = useProfileAPI();

    const navigate = useNavigate();

    const [comment, setComment] = useState<string>(initComment);

    const ref = useRef<HTMLTextAreaElement>(null);
    
    const {data:parentProfileData} = fetchProfile(parentProfileId);
   

    const mentionName = useMemo(()=>{
        return parentProfileData?.data?.option?.nick? `@${parentProfileData?.data?.option?.nick}` : undefined;
    },[parentProfileData]);


    /**
     * 
     */
    const handleClickSignin = useCallback(() => {
        navigate('/auth/signin');
    }, [navigate]);

    /**
     * 
     */
    const handleChangeComment = useCallback((e:ChangeEvent<HTMLTextAreaElement>) => {
        setComment(e.currentTarget.value);
    },[]);
    
    /**
     * 
     */
    const handleClickWriteComment = useCallback(async (text:string) => {
        if (commentId) {
            await mutationPatchComment.mutateAsync({
                id: commentId,
                data: {
                    target_id: targetId,
                    parent_id: parentId,
                    txt: { contents: text },
                }
            });
            
            if (handleClickEditCancel) {
                handleClickEditCancel();
            }
                
        } else {
            await mutationPostComments.mutateAsync({
                data: {
                    target_id: targetId,
                    target_profile_id: targetProfileId,
                    parent_id: parentId,
                    mention_id: mention? parentProfileData?.data?._id : undefined,
                    txt: { contents: text },
                    option: {
                        fixed: false,
                        language: "",
                        show: false
                    },
                }
            });
        }

        setComment('');

        if (handleAfterSubmit)
            handleAfterSubmit();
    }, [commentId, handleAfterSubmit, mutationPatchComment, targetId, parentId, handleClickEditCancel, mutationPostComments, targetProfileId, mention, parentProfileData]);

    
    /**
     * 
     */
    const handleFocusTextArea = useCallback(() => {
        if (ConstantsEx.isMobile()) {
            showInputHelper({
                text: comment,
                onChange: handleChangeComment,
                onClick: handleClickWriteComment,
                nick: parentProfileData?.data?.option?.nick,
                mention: mention ? mentionName : undefined,
                thumbnail: meThumbnail ?? undefined,
            });

            if (ref && ref.current)
                ref.current?.blur();
    
        }
    }, [comment, handleChangeComment, handleClickWriteComment, meThumbnail, mention, mentionName, parentProfileData?.data?.option?.nick, showInputHelper]);

    return {ref, comment, isLogined, mentionName, meThumbnail, handleClickSignin, handleClickWriteComment, handleChangeComment, handleFocusTextArea}
}

export default useCommentWrite;