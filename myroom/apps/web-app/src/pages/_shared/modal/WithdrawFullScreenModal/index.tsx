import { Modal, ModalProps } from "@/components/_core/ModalCore";
import style from './style.module.scss';
import CircleButton from "@/components/Buttons/CircleButton";
import Icon from "@/components/Icon";
import Text from "@/components/Text";
import IconCheckBox from "@/components/Forms/CheckBox/IconCheckBox";
import Button from "@/components/Buttons/Button";
import CustomButton from "@/components/Buttons/CustomButton";
import useWithdrawFullScreenModal from "./hooks";
import { comma } from "@/common/utils/string-format";
interface IWithdrawFullScreenModal
  extends Omit<ModalProps, 'onRequestClose'> {
  
}
const WithdrawFullScreenModal = ({onRequestClose}:IWithdrawFullScreenModal)=>{
  const {hardCurrency, softCurrency, checkedConfirm, isAccountAuthentication
    ,handleOnChangeConfirmCheckBox, handleAccountAuthentication, handleWithdraw} = useWithdrawFullScreenModal();
  const Header = () => {
    return (
      <div className={style.header}>
        <CircleButton size="xs" shape="none" onClick={onRequestClose}>
          <Icon name="Top_Arrow_left_M" />
        </CircleButton>
        <div className={style.headerText}>서비스 탈퇴</div>
      </div>
    );
  };
  const Section = (({className, children}:{className?:string, children:React.ReactElement[]|React.ReactElement})=>{
    return(
      <div className={`${style.section} ${className?className:''}`}>
        {children}
      </div>
    );
  });
  const WithdrawHeader = ()=>{
    return (
      <div className={style.withdrawHeader}>
        <div className={style.title}>
          탈퇴하기 전에 안내 사항을 꼭 확인해 주세요!
        </div>
        <div className={style.desc}>
          탈퇴 후 삭제된 정보는 다시 복구할 수 없으며, 탈퇴일로부터 14일간 재가입을 할 수 없습니다. 탈퇴한 아이디는 본인과 타인 모두 재사용하거나 복구할 수 없으니 신중하게 선택해 주시길 바랍니다.
        </div>
      </div>
    );
  };
  
  const InfoTitle = ({textId}:{textId:string})=>{
    return (
      <div className={style.infoTitle}>
        <Icon name='Erroe'/>
        <div className={style.title}>
          <Text locale={{textId:textId}}/>
        </div>
      </div>
    );
  };
  const InfoSubTitle = ({textId}:{textId:string})=>{
    return(
      <div className={style.infoSubTitle}>
        <Text locale={{textId:textId}}/>
      </div>
    );
  };
  const InfoContents = ({textId} : {textId:string})=>{
    return(
      <div className={style.infoContents}>
        <div className={style.dot}></div>
        <div className={style.contents}>
          <Text locale={{textId:textId}}/>
        </div>
      </div>
    );
  };
  const DeleteInfos = ()=>{
    return(
      <div className={style.deleteInfoWrapper}>
        <InfoTitle textId="삭제되는 정보" />
        <InfoSubTitle textId="아이템 및 재화 정보" />
        <InfoContents textId="탈퇴 시 현재 보유하고 있는 아이템과 재화는 즉시 소멸되며, 재가입해도 복원되지 않습니다." />
        <InfoSubTitle textId="개인정보" />
        <InfoContents textId="안내 메일 발송과 CS 문의 대응을 위해 계정과 이메일 주소는 암호화하여 탈퇴 일로부터 1년간 보관 후 파기합니다." />
        <InfoContents textId="암호화된 이용자 확인값(C), 카드영수증 항목 및 상세내역은 탈퇴일로부터 1년간 보관 후 파기합니다." />
        <div className={style.splitLine}></div>
      </div>
    );
  }
  const KeepInfos = ()=>{
    return(
      <div className={style.infoWrapper}>
        <InfoTitle textId="유지되는 정보" />
        <InfoSubTitle textId="등록 콘텐츠" />
        <InfoContents textId="마이룸, 피드, 핑스 등에 올린 게시물 및 댓글과 같은 콘텐츠는 탈퇴 시 자동으로 삭제되지 않고 그대로 남아있습니다. 삭제를 원하시면 반드시 탈퇴 전에 삭제하시길 바랍니다." />
      </div>
    );
  };
  const UserInfo = ()=>{
    return(
      <div className={style.userInfoWrapper}>
        <div className={style.title}>
          <Text locale={{textId:"탈퇴하려는 계정"}}/>
        </div>
        <div className={style.grayBox}>
          colorverse29
        </div>
        <div className={style.space}></div>
        <div className={style.title}>
          <Text locale={{textId:"탈퇴시 소멸되는 재화"}}/>
        </div>
        <div className={style.grayBox}>
          <Icon name="Money_Diamond_SS"/>
          <div className={style.goodsValue}>{comma(softCurrency)}</div>
          <Icon name="Money_Cube_SS"/>
          <div className={style.goodsValue}>{comma(hardCurrency)}</div>
        </div>
      </div>
    );
  };
  const ConfirmArea = ()=>{
    return(
      <div className={style.confirmArea}>
        <label className={style.checkBoxWrapper}>
          <IconCheckBox className={style.checkBox} icon_on="Common_Check_M_On" icon_off="Common_Check_M" checked={checkedConfirm} onChange={handleOnChangeConfirmCheckBox}/>
          <Text locale={{textId:"안내 사항을 모두 확인했으며, 이에 동의합니다."}}/>
        </label>
        <CustomButton className={style.btnFullCapsule} disabled={isAccountAuthentication} onClick={handleAccountAuthentication}>계정 인증</CustomButton>
        <CustomButton className={style.btnFullCapsule} disabled={!isAccountAuthentication || !checkedConfirm} onClick={handleWithdraw}>탈퇴하기</CustomButton>
        <CustomButton className={style.btnCancelWithdraw} onClick={onRequestClose}>탈퇴 취소하기</CustomButton>
      </div>
    );
  };
  return(
    <Modal isOpen={true}>
      <div className={style.withdrawModalWrapper}>
        <Header/>
        <div className={style.body}>
          <WithdrawHeader/>
          <Section>
            <DeleteInfos/>
            <KeepInfos/>
          </Section>
          <Section>
            <UserInfo/>
          </Section>
          <ConfirmArea/>
        </div>
      </div>
    </Modal>
  );
};

export default WithdrawFullScreenModal;