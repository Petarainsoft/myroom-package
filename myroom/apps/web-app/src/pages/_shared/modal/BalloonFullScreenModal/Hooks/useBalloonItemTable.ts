import { BalloonResource } from 'client-core/tableData/defines/System_Interface';
import { TableDataManager } from 'client-core/tableData/tableDataManager';
import { useEffect, useState } from 'react';

const useBalloonItemTable = (balloonItemId: string) => {
  const [, setBalloonTableData] = useState<BalloonResource | null>(null);
  const [letterBG, setLetterBG] = useState('#fff');
  const checkTableData = async () => {
    if (!TableDataManager.getInstance()) {
      new TableDataManager().loadTableDatas();
    }
    while (!TableDataManager.getInstance().isLoaded()) {
      await new Promise((r) => setTimeout(r, 100));
    }
    const tableData =
      TableDataManager.getInstance().findBalloonResource(balloonItemId);
    setBalloonTableData(tableData);
    setLetterBG(tableData?.BalloonLetterBG ?? '#fff');
  };

  useEffect(() => {
    checkTableData();
  }, [balloonItemId]);

  return { letterBG };
};

export default useBalloonItemTable;
