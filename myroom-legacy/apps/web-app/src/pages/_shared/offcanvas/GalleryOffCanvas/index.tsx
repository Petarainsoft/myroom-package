import React, { useMemo } from 'react';
import InfiniteLoader from 'react-window-infinite-loader';
import classNames from 'classnames';
import { FixedSizeGrid } from 'react-window';
import CustomButton from '@/components/Buttons/CustomButton';
import Icon from '@/components/Icon';
import Text from '@/components/Text';
import Button from '@/components/Buttons/Button';
import useGalleryOffCanvas from './hooks';
import Container from '../../layouts/Container';
import styles from './styles.module.scss';
import NotFound, { NotFoundProps } from '../../ui/NotFound';
import { motion } from 'framer-motion';
import MarketToggleButton from '@/pages/_shared/ui/Buttons/MarketToggleButton';
import ToolTip from '../../ui/ToolTip';
import CategoryItem from './CategoryItem';


export type Category = {
  id: string;
  textId: string;
  descId?: string;
};


export type ContentsProps = {
  itemCount: number;
  elementId: (index: number) => string;
  element: (index: number) => React.ReactNode;
  shape?: 'rect' | 'square';
  isItemLoaded: (index: number) => boolean;
  loadMoreItems: (startIndex: number, stopIndex: number) => Promise<void>;
};

export type GalleryOffCanvasProps = {
  isMarket?: boolean;
  disabledToggle?: boolean;
  disabledMinimize?: boolean;
  saveBtnId?: string;
  category?: Category[];
  subCategory?: Category[];
  contents: ContentsProps;
  actionArea?: {
    start?: React.ReactNode;
    center?: React.ReactNode;
    end?: React.ReactNode;
  };
  notFound?: NotFoundProps;
  currentCategory?:string;
  currentSubCategory?: string;
  categoryArea?: React.ReactNode;
  subCategoryArea?: React.ReactNode;
  onToggle?: () => void;
  onClickCategory?: (id: any) => void;
  onClickSubCategory?: (id: any) => void;
};

const GalleryOffCanvas = ({
  isMarket,
  disabledToggle,
  disabledMinimize,
  category,
  subCategory,
  contents,
  actionArea,
  notFound,
  currentCategory,
  currentSubCategory,
  categoryArea,
  subCategoryArea,
  onToggle,
  onClickCategory,
  onClickSubCategory,
}: GalleryOffCanvasProps) => {
  const {
    minimize,
    columnCount,
    showSubCategory,
    contentsWrapRef,
    width,
    height,
    itemWidth,
    itemHeight,
    handleClickMinimize,
    handleClickCategory,
    handleClickSubCategory,
    handleToggle,
    handleScroll,
    gridOnItemsRendered,
    gridStyleWithGap,
  } = useGalleryOffCanvas({
    contents,
    onToggle,
    onClickCategory,
    onClickSubCategory,
  });


  const ItemRenderer = ({ rowIndex, columnIndex, style }: any) => {
    const index = rowIndex * columnCount + columnIndex;
    return (
      <div
        key={contents.elementId(index)}
        style={gridStyleWithGap(style, columnIndex, subCategory ? 54 : 20)}
      >
        {contents?.element(index)}
      </div>
    );
  };

  const rowCount = useMemo(() => {
    return Math.ceil(contents?.itemCount / columnCount);
  }, [columnCount, contents]);

  return (
    <React.Fragment>
      <div
        className={classNames(styles['wrap'], {
          [styles['minimize']]: minimize,
        })}
      >
        {actionArea && (
          <Container className={styles['action-wrap']}>
            <div className={styles['action-start']}>{actionArea.start}</div>
            <div className={styles['action-center']}>{actionArea.center}</div>
            <div className={styles['action-end']}>{actionArea.end}</div>
          </Container>
        )}
        {!disabledMinimize && (
          <div className={styles['anchor']}>
            <CustomButton onClick={handleClickMinimize}>
              <Icon name={minimize ? 'Open' : 'Close'} />
            </CustomButton>
          </div>
        )}
        <div className={styles['cate-wrap']}>
          {!disabledToggle && (
            <MarketToggleButton
              editMode={isMarket ? 'MARKET' : 'MY'}
              onClickToggle={handleToggle}
            />
          )}
          <div className={styles['cate-container']}>
            {category?.map((item) => (
              <CategoryItem item={item} handleClickCategory={handleClickCategory} currentCategory={currentCategory} />
            ))}
          </div>
          {categoryArea}
        </div>
        <div className={classNames(styles['contents-wrap'])}>
        {subCategory && (
          <motion.div
            className={styles['sub-container']}
            initial="visible"
            animate={showSubCategory ? 'visible' : 'hidden'}
            variants={{
              hidden: {
                y: '-100%',
                opacity: 0.5,
              },
            }}
          >
            {subCategory?.map((item) => (
              <Button
                className={styles['cate-item']}
                key={item.id}
                size="xs"
                variant={currentSubCategory === item.id ? 'primary' : 'elevated'}
                onClick={() => handleClickSubCategory(item.id)}
              >
                <div>
                  <Text locale={{ textId: item.textId }} />
                </div>
              </Button>
            ))}
          </motion.div>
          )}
          {subCategoryArea}
          {contents?.itemCount > 0 ? (
            <div
              className={classNames(styles['contents-container'])}
              ref={contentsWrapRef}
            >
              <InfiniteLoader
                itemCount={contents?.itemCount}
                isItemLoaded={contents.isItemLoaded}
                loadMoreItems={contents.loadMoreItems}
              >
                {({ onItemsRendered, ref }) => (
                  <FixedSizeGrid
                    className={styles['grid-wrap']}
                    columnCount={columnCount}
                    columnWidth={itemWidth}
                    rowCount={rowCount}
                    rowHeight={itemHeight}
                    width={width}
                    height={height}
                    onItemsRendered={(params) =>
                      gridOnItemsRendered(params, onItemsRendered)
                    }
                    ref={ref}
                    onScroll={handleScroll}
                  >
                    {ItemRenderer}
                  </FixedSizeGrid>
                )}
              </InfiniteLoader>
            </div>
          ) : (
            <NotFound {...notFound} />
          )}
        </div>
      </div>
    </React.Fragment>
  );
};

export default GalleryOffCanvas;
