import { Modal, ModalProps } from "@/components/_core/ModalCore";
import style from './style.module.scss';
import CircleButton from "@/components/Buttons/CircleButton";
import Icon from "@/components/Icon";
import Button from "@/components/Buttons/Button";
import useSessionListFullScreenModal from "./hooks";
import { SessionData } from "@/apis/User/Session/type";
import dayjs from "dayjs";
interface ISessionListFullScreenModal
  extends Omit<ModalProps, 'onRequestClose'> {
  
}
const SessionListFullScreenModal = ({onRequestClose}:ISessionListFullScreenModal)=>{
  const {sessionList, hasNextPageMeSession, handleAllLogout} = useSessionListFullScreenModal();
  const Header = () => {
    return (
      <div className={style.header}>
        <CircleButton size="xs" shape="none" onClick={onRequestClose}>
          <Icon name="Top_Arrow_left_M" />
        </CircleButton>
        <div className={style.headerText}>모든 브라우저에서 로그아웃</div>
      </div>
    );
  };
  const SessionCell = ({sessionData}:{sessionData:SessionData})=>{
    const isConnecting = false;
    const lastLoginDate = dayjs(sessionData.stat.updated).format('YYYY-MM-DD HH;mm;ss');
    
    return(
      <div className={style.sessionCell}>
        <div className={style.browserNameWrapper}>
          <div className={style.browserName}>브라우저 : {sessionData.option.device_info}</div>
          {isConnecting?<div className={style.connectingMark}>접속 중</div>:null}
        </div>
        
        <div className={style.lastLoginDate}>마지막 로그인 일시 : {lastLoginDate}</div>
      </div>
    );
  };
  
  return(
    <Modal isOpen={true}>
      <div className={style.logoutAllBrowserWrapper}>
        <Header/>
        <div className={style.topWrapper}>
          <div className={style.desc}>
            현재 로그인 중인 모든 브라우저에서 로그아웃 하실 수 있습니다.<br/>
            전체 로그아웃 반영에는 최대 1시간 정도가 소요될 수 있으며,<br/>
            지금 접속 중인 브라우저의 로그인은 유지됩니다.
          </div>
          <Button size='l' shape='capsule' onClick={handleAllLogout}>전체 로그아웃</Button>
        </div>
        <div className={style.sessionListWrapper}>
          <div className={style.title}>로그인 목록</div>
          {sessionList?.map((sessionData)=><SessionCell key={sessionData._id} sessionData={sessionData}/>)}
          
          {hasNextPageMeSession?<div className={style.moreBtnWrapper}>
            <Button shape="capsule" size="l" variant="white">더 보기</Button>
          </div>:null}
          
        </div>
      </div>
    </Modal>
  );
};

export default SessionListFullScreenModal;