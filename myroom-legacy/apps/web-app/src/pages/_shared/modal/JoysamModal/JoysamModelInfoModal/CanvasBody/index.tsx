import useItemFullScreenModal from '../../../ItemFullScreenModal/hooks';
import CanvasScene from '@/pages/_shared/ui/CanvasScene';
import React from 'react';

type CanvasProps = {
    className?: string;
    itemId: string;
    checkChangeItemId?: boolean;
};

const CanvasBody = ({ className, itemId, checkChangeItemId }: CanvasProps) => {

    const { itemFunctionType, handleClickSave, handleCloseModal, onAfterInitScene, onChangeItemId } = useItemFullScreenModal(itemId);

    React.useEffect(() => {
        if (checkChangeItemId || checkChangeItemId === undefined) onChangeItemId();
    }, [checkChangeItemId, itemId]);

    return <CanvasScene type='ITEM' className={className} onAfterSceneReady={onAfterInitScene} />;
}

export default CanvasBody;