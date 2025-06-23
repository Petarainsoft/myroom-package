import React, { useState } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import {
  purchaseItemListAtom,
  selectedClientItemAtom,
  isEnvLightAtom,
  selectedScreenItemAtom
} from '@/common/stores';
import ItemActionOpt from './ItemAction';
import ColorActionOpt from './ColorAction';

const Action = (): React.ReactElement => {

  const isEnvLight = useAtomValue(isEnvLightAtom);
  const selectedScreenItem = useAtomValue(selectedScreenItemAtom);
  const [selectedClientItem, setSelectedClientItem] = useAtom(selectedClientItemAtom);
  const [purchaseItemList, setPurchaseItemList] = useAtom(purchaseItemListAtom);
  const [purchaseItemCount, setPurchaseItemCount] = useState(purchaseItemList.filter((data, index, self) => self.indexOf(data) === index).length);

  const [removeClicked, setRemoveClicked] = React.useState(false);
  const [removeId, setRemoveId] = React.useState('');

  React.useEffect(() => {
    // 임시코드. purchaseItemList가 정상적인 리스트를 가져야한다.
    setPurchaseItemCount(
      purchaseItemList.filter(
        (data, index, self) => self.indexOf(data) === index,
      ).length,
    );
  }, [purchaseItemList]);

  return (
    <>
      {isEnvLight ? <ColorActionOpt /> : <></>}
      {selectedClientItem ? ( 
        <ItemActionOpt
          removeId={removeId}
          setRemoveId={setRemoveId}
          removeClicked={removeClicked}
          setRemoveClicked={setRemoveClicked}
        />
      ) : (
        <></>
      )}
    </>
  );
};

export default Action;
