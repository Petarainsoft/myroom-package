import Icon from '@/components/Icon';
import React from 'react';
import style from './style.module.scss';
import Text from '@/components/Text';

const SearchNone = () => {
  return (
    <div className={style.figureSearchNoneWrapper}>
      <div className={style.iconWrapper}>
        <Icon name="Allim_Empty1" />
      </div>
      <Text
        locale={{
          textId: 'GCM.000044',
        }}
        defaultValue="검색 결과가 없습니다."
      />
    </div>
  );
};

export default SearchNone;
