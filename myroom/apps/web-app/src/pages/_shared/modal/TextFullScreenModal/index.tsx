import { Modal, ModalProps } from "@/components/_core/ModalCore";
import style from './styles.module.scss';
import Text, { TextProps } from "@/components/Text";
import Container from "../../layouts/Container";
import View from "../../layouts/View";


interface ITextFullScreenModal extends Omit<ModalProps, 'onRequestClose'> {
  titleProps: TextProps;
  contentsProps: TextProps;
  closeBtnShape :'x'|'arrow';
  handleClose: () => void;
}
const TextFullScreenModal = ({titleProps, contentsProps, closeBtnShape='x', onRequestClose}:ITextFullScreenModal)=>{
  return(
    <Modal isOpen={true}>
      <div className={style.background}>
        <View disableNavigation headerOptions={{
          startArea: <div>
            <Text {...titleProps}/>
          </div>,
          closeOptions: {
            icon: closeBtnShape,
            onClick: onRequestClose,
          }
        }}>
          <Container className={style.container}>
            <div className={style.contentsWrapper}>
              <Text {...contentsProps}/>
            </div>
          </Container>
        </View>
        
      </div>
    </Modal>
  );
  
};
export default TextFullScreenModal;