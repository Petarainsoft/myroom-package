import style from './style.module.scss';
import Button from '@/components/Buttons/Button';
import Text from '@/components/Text';
import Image from '@/components/Image';
import { color } from 'framer-motion';
import Icon from '@/components/Icon';
import CustomButton from '@/components/Buttons/CustomButton';
import joysamText from '@/assets/joysam.json';
import { BASE_IMG_URL } from '@/common/constants';

type InfoBodyProps = {
    id: string;
    name: string;
    desc: string;
    thumbnail: string;
    backColor?: string;
    gradeColor?: string;
    categoryNameId: string;
    onTouchBuy: () => void;
    buttonPath: string;
    buttonClick: () => void;
};

const InfoBody = ({ id, name, desc, thumbnail, categoryNameId, backColor, gradeColor, onTouchBuy, buttonPath, buttonClick }: InfoBodyProps) => {
    return (
        <div className={style.body}>
            <div className={style.color_body} style={{ backgroundColor: backColor ?? '#fff' }}></div>
            <div className={style.inner_body}>
                <div className={style.view1}>
                    <div className={style.grade_mark} style={{ backgroundColor: gradeColor }}>
                        <div className={style.text}>
                            <Text locale={{ textId: categoryNameId }} />
                        </div>
                    </div>
                    <div className={style.title}>
                        <Text text={name} />
                    </div>
                    <div className={style.material_desc}>
                        <Text text={joysamText['JOY.000002']} />
                    </div>
                    <div className={style.desc}>
                        <Text text={desc} />
                    </div>
                    <div className={style.btn_round} onClick={onTouchBuy}>
                        <div className={style.btn_inner}>
                            <div className={style.btn_img_border}>
                                <Image src={BASE_IMG_URL + '/joysam/colorpaper.jpg'} className={style.btn_img} />
                            </div>
                            <div className={style.btn_content_view}>
                                <div className={style.btn_title}>
                                    <Text text={joysamText['JOY.000003']} />
                                </div>
                                <div className={style.btn_buy}>
                                    <Text text={joysamText['JOY.000004']} />
                                </div>
                            </div>
                        </div>
                        <div className={style.btn_link}>
                            <Icon name="joysam/Button_Next" />
                        </div>
                    </div>
                </div>
            </div>
            <CustomButton className={style.canvas_btn} onClick={buttonClick}>
                <Icon name={buttonPath} />
            </CustomButton>
        </div>
    );
}

export const NullInfoBody = () => {
    return (
        <div className={style.body}>
        </div>
    );
}

export default InfoBody;