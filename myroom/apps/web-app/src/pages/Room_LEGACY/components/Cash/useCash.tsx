import useBillingAPI from '@/apis/Billing/Cash';
import { ECurrencyType } from 'client-core';
import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';

const useCash = () => {
  const queryClient = useQueryClient();
  const { fetchCash } = useBillingAPI();
  const { data, isLoading } = fetchCash();
  const [hardCurrency, setHardCurrency] = useState<string>('0');
  const [softCurrency, setSoftCurrency] = useState<string>('0');

  const refreshCash = () => {
    queryClient.invalidateQueries({
      queryKey: ['fetchCash'],
      exact: true,
    });
  };

  useEffect(() => {
    if (isLoading) return;
    if (!data) return;
    data.list?.map((item) => {
      if (item.cash_id == ECurrencyType.HARDCURRENCY) {
        setHardCurrency(item.amount.toString());
        return;
      }
      if (item.cash_id == ECurrencyType.SOFTCURRENCY1) {
        setSoftCurrency(item.amount.toString());
        return;
      }
    });
  }, [data]);
  return { refreshCash, hardCurrency, softCurrency };
};

export default useCash;
