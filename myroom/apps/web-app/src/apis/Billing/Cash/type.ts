import {
  CommonDateLimitParams,
  CommonOrderParams,
  CommonResponse,
} from '@/apis/_common/type';

export type CashList = {
  cash_id: number;
  amount: number;
};

export type CashResponse = CommonResponse & {
  error: number;
  list: CashList[];
};
