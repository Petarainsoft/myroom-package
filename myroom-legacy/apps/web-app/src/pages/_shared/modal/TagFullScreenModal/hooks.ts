import useModal from "@/common/hooks/Modal/useModal";
import { useCallback, useState } from "react";

type TagStatus = "ITEM" | "PING"

const useTagFullScreenModal = () => { 
    const [tagStatus, setTagStatus] = useState<TagStatus>("ITEM");
    const tagFullScreenModal = useModal('TagFullScreenModal');

    const handleClickClose = useCallback(() => { 
        tagFullScreenModal.deleteModal();
    }, [tagFullScreenModal]);

    const handleClickTab = (status:TagStatus) => {
        setTagStatus(status);
    }

    return { tagStatus, handleClickClose, handleClickTab }
}

export default useTagFullScreenModal;