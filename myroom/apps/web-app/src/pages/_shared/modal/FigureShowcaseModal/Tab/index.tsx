import React from 'react';
import style from './style.module.scss';
import CustomButton from '@/components/Buttons/CustomButton';
import Icon from '@/components/Icon';
import classNames from 'classnames';
import Text from '@/components/Text';
import { EFigureShowcaseTab } from '../store';
import { useNavigationActions } from '../item.hook';

interface ITab {
  currentTab: number;
  setCurrentTab: React.Dispatch<React.SetStateAction<number>>;
}

const Tab = ({ currentTab, setCurrentTab }: ITab) => {
  const { handleTab } = useNavigationActions();

  const handleChangeTab = (tab: number) => {
    if (tab === currentTab) return;
    setCurrentTab(tab);
    handleTab(tab);
  };
  return (
    <div className={style.figureTabWrapper}>
      <CustomButton
        onClick={() => handleChangeTab(EFigureShowcaseTab.CARD)}
        className={classNames(style.tabButton, {
          [style.activeTab]: currentTab == EFigureShowcaseTab.CARD,
        })}
      >
        <div className={classNames(style.iconWrapper)}>
          <Icon
            badge={{ isActive: currentTab == EFigureShowcaseTab.CARD }}
            name={'Deco_Figure_S'}
          />
        </div>
        <Text locale={{ textId: 'GMY.000178' }} defaultValue="카드 뷰" />
      </CustomButton>
      <CustomButton
        onClick={() => handleChangeTab(EFigureShowcaseTab.FEED)}
        className={classNames(style.tabButton, {
          [style.activeTab]: currentTab == EFigureShowcaseTab.FEED,
        })}
      >
        <div className={classNames(style.iconWrapper)}>
          <Icon
            badge={{ isActive: currentTab == EFigureShowcaseTab.FEED }}
            name={'Deco_Figure_View_S'}
          />
        </div>
        <Text locale={{ textId: 'GMY.000179' }} defaultValue="피드 뷰" />
      </CustomButton>
    </div>
  );
};

export default Tab;
