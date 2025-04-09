import useUserAPI from '@/apis/User/User';
import useAppAPI from '@/apis/World/App';
import useTermsAPI from '@/apis/World/Terms';
import useModal from '@/common/hooks/Modal/useModal';
import toNumber from 'lodash/toNumber';
import { ChangeEvent, MouseEvent, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TermsResponse } from '@/apis/World/Terms/type';

export enum TermKind {
  Service = 1,
  Personal = 1 << 1,
  Promotion = 1 << 2,
  ALL_CHECKED = (1 << 3) - 1,
}
export type TermData = {
  kind: TermKind;
  titleTextId: string;
  detail: TermDetailData | null;
  isEssential: boolean;
};
export type TermDetailData = {
  title: string;
  contents: string;
};
const useTerms = () => {
  const navigate = useNavigate();
  const { mutationUsersMe } = useUserAPI();
  const TextFullScreenModal = useModal('TextFullScreenModal');
  const termsRes = useAppAPI().fetchApp('').data?.data.option.term;

  const termServerData: (TermsResponse | null | unknown)[] = [];
  termServerData[TermKind.Service] = useTermsAPI().fetchTerms(
    termsRes?.svc ?? '',
  );
  termServerData[TermKind.Personal] = useTermsAPI().fetchTerms(
    termsRes?.privacy ?? '',
  );
  termServerData[TermKind.Promotion] = useTermsAPI().fetchTerms(
    termsRes?.optional?.at(0) ?? '',
  ); // 어차피 title 때문에라도 작업이 필요하니....

  let ESSENTIAL_FLAG = 0; // 필수로 체크해야 하는 flag.
  const [checkFlag, setCheckFlag] = useState(0);

  const termDataList: TermData[] = [];
  const addTermData = (
    kind: TermKind,
    titleTextId: string,
    isEssential: boolean,
  ) => {
    let detail: TermDetailData | null = null;
    const res = termServerData[kind] as TermsResponse;
    if (res && !res.error && res.data && res.data.data) {
      detail = {
        title: titleTextId,
        contents: res.data.data.txt.content.ko,
      };
    }
    termDataList[kind] = {
      kind: kind,
      titleTextId: titleTextId,
      detail: detail,
      isEssential: isEssential,
    };
    if (isEssential) ESSENTIAL_FLAG |= kind;
  };
  addTermData(TermKind.Service, 'GSU.000010', true); // GSU000010 : 서비스 약관에 동의
  addTermData(TermKind.Personal, 'GSU.000012', true); // GSU000012 : 개인정보 수집 및 사용에 동의
  addTermData(TermKind.Promotion, 'GSU.000013', false); // GSU000013 : 인기 콘텐츠 및 프로모션 알림 수신 동의

  const handleCheckboxChanged = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const flag = toNumber(e.currentTarget.value);
      if (flag > 0) {
        if (e.currentTarget.checked)
          setCheckFlag((prevState: TermKind) => {
            return prevState | flag;
          });
        else
          setCheckFlag((prevState: TermKind) => {
            return prevState & ~flag;
          });
      }
    },
    [],
  );

  const handleClickAllAgree = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.currentTarget.checked) setCheckFlag(TermKind.ALL_CHECKED);
      else setCheckFlag(0);
    },
    [],
  );

  const handleClickDetailView = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget) return;
      const termsData = termDataList[toNumber(e.currentTarget.value)];
      if (!termsData || !termsData.detail) return;
      TextFullScreenModal.createModal({
        titleProps: {
          locale: { textId: termsData.detail.title },
          hasTag: true,
        },
        contentsProps: {
          locale: { textId: termsData.detail.contents },
          hasTag: true,
        },
      });
    },
    [termDataList],
  );

  const handleClickNext = async () => {
    await mutationUsersMe.mutateAsync({});
    navigate('/auth/signup/room');
  };

  return {
    termDataList,
    checkFlag,
    ESSENTIAL_FLAG: ESSENTIAL_FLAG,
    handleClickAllAgree,
    handleCheckboxChanged,
    handleClickDetailView,
    handleClickNext,
  };
};
export default useTerms;
