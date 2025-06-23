import Button from '@/components/Buttons/Button';
import OffCanvas from '@/pages/_shared/layouts/Offcanvas';
import Text from '@/components/Text';
import InputText from '@/components/Forms/InputText';
import useItemLink from './hooks';
import styles from './styles.module.scss';
import Container from '@/pages/_shared/layouts/Container';
import CustomButton from '@/components/Buttons/CustomButton';
import Icon from '@/components/Icon';
import { t } from 'i18next';
import YoutubePreview from './YoutubePreview';
import { LinkType } from '../../type';
import classNames from 'classnames';

type LinkProps = {
  isOpen: boolean;
  type: LinkType;
  onClose: () => void;
};

const Link = ({ isOpen, type, onClose }: LinkProps) => {
  const {
    link,
    alias,
    videoPreviewUrl,
    showVideoPreview,
    linkDisabled,
    handleChangeLink,
    handleChangeAlias,
    handleClickPreview,
    handleClickSubmit,
  } = useItemLink(type, onClose);
  //테스트용
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  return (
    <>
      <OffCanvas
        isOpen={isOpen}
        onClose={onClose}
        shouldCloseOnBackdropClick={false}
        enableFullHeight={true}
        disableDrag={true}
        headerOptions={{
          disableClose: true,
          customElement: (
            <div className={styles['header']}>
              <CustomButton onClick={onClose}>
                <Icon name="Top_Arrow_left_M" />
              </CustomButton>
              <div className={styles['title']}>
                <Text
                  locale={{
                    textId: type === 'link' ? 'GMY.000091' : 'GMY.000093',
                  }}
                />
              </div>
            </div>
          ),
        }}
      >
        <div className={styles['linkRegisterOffCanvasWrapper']}>
          <div
            className={classNames(styles['flex'], {
              [styles['isIOS']]: isIOS,
            })}
          >
            <Container
              className={classNames(styles['wrap'], {
                [styles['isIOS']]: isIOS,
              })}
            >
              <div className={styles['section']}>
                <div className={styles['title']}>
                  <Text
                    locale={{
                      textId: type === 'link' ? 'GMY.000098' : 'GMY.000105',
                    }}
                  />
                </div>
                <InputText
                  type={'text'}
                  placeholder={t(type === 'link' ? 'GMY.000097' : 'GMY.000106')}
                  value={link}
                  onChange={handleChangeLink}
                />
                <div className={styles['desc']}>
                  <div className={styles['check']}>
                    <Icon name={'check'} />
                  </div>
                  <div>
                    <Text
                      locale={{
                        textId: type === 'link' ? 'GMY.000095' : 'GMY.000107',
                      }}
                    />
                    <CustomButton
                      className={styles['preview']}
                      onClick={() => handleClickPreview(type)}
                    >
                      <Text locale={{ textId: 'GMY.000096' }} />
                    </CustomButton>
                  </div>
                </div>
              </div>
              {type === 'link' && (
                <div className={styles['section']}>
                  <div className={styles['title']}>
                    <Text
                      locale={{
                        textId: 'GMY.000099',
                      }}
                    />
                  </div>
                  <InputText
                    type={'text'}
                    placeholder={t('GMY.000100')}
                    value={alias}
                    onChange={handleChangeAlias}
                  />
                  <div className={styles['desc']}>
                    <div className={styles['check']}>
                      <Icon name={'check'} />
                    </div>
                    <div>
                      <Text
                        locale={{
                          textId: 'GMY.000101',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
              {type === 'video' && showVideoPreview && (
                <div className={styles['section']}>
                  <YoutubePreview src={videoPreviewUrl} />
                  <div className={styles['desc']}>
                    <div className={styles['check']}>
                      <Icon name={'check'} />
                    </div>
                    <div>
                      <Text
                        locale={{
                          textId: 'GMY.000108',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </Container>
            <Button
              shape="rect"
              size="full"
              variant="primary"
              className={classNames(styles['submit'], {
                [styles['isIOS']]: isIOS,
              })}
              onClick={handleClickSubmit}
              disabled={linkDisabled}
            >
              <Text locale={{ textId: 'GMY.000094' }} />
            </Button>
          </div>
          <div className={styles['scrollable']} />
        </div>
      </OffCanvas>
    </>
  );
};

export default Link;
