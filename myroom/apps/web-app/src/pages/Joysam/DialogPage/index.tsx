import { useEffect } from 'react';
import useModal from '@/common/hooks/Modal/useModal';
import { TableDataManager } from 'client-core';
import { useLocation } from 'react-router-dom';
import queryString from 'query-string';
const DialogPage = () => {
  const query = queryString.parse(useLocation().search);
  const dialogId = query['dialogId'];
  const resultId = query['resultId'];
  const DialogModal = useModal('DialogModal');
  const checkTableData = async () => {
    if (!TableDataManager.getInstance()) {
      new TableDataManager().loadTableDatas();
    }
    while (!TableDataManager.getInstance().isLoaded()) {
      await new Promise((r) => setTimeout(r, 100));
    }
    DialogModal.createModal({ dialogId: dialogId, dialogResultId: resultId });
  };
  useEffect(() => {
    checkTableData();
  }, [checkTableData]);

  useEffect(() => {
    return () => {
      DialogModal.deleteModal();
    };
  }, []);

  return <></>;
};

export default DialogPage;
