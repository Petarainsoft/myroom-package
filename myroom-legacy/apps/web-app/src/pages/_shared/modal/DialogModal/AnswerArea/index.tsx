import style from './style.module.scss';
import { DialogText } from 'client-core/tableData/defines/System_Interface';
import AnswerItem from './AnswerItem';
import React from 'react';
import { t } from 'i18next';

type AnswerAreaProps = {
  answerList: DialogText[] | null;
  selectedId?: string | null;
  borderRound?: boolean;
  onTouch: (id: string) => void;
};

const AnswerArea = ({
  answerList,
  selectedId,
  borderRound,
  onTouch,
}: AnswerAreaProps) => {
  const listItems = React.useMemo(() => {
    return (
      answerList &&
      answerList.map((item) => {
        return (
          <AnswerItem
            key={item.ID}
            id={item.ID}
            name={t(item.LocalKey)}
            selected={item.ID === selectedId}
            onTouch={onTouch}
          />
        );
      })
    );
  }, [answerList, selectedId]);

  if (!answerList) return null;

  return (
    <div
      className={`${style['body']} ${borderRound ? style['borderRound'] : ''}`}
    >
      <ul className={style['list']}>{listItems}</ul>
    </div>
  );
};

export default AnswerArea;
