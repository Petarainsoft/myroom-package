import ProfileCard from '@/pages/_shared/modal/ProfileCardFullScreenModal/ProfileCard';
import useProfileCardTestPage from './hooks';
import style from './style.module.scss';
import CanvasScene from '@/pages/_shared/ui/CanvasScene';
const ProfileCardTestPage = ()=>{
  const {
    strCardJson,
    cardManifest,
    avatarImageData,
    onAfterSceneReady,
    handleNextAvatarAction,
    handleOnChangeImagesField, 
    handleOnChangeJsonFileField, 
    handleOnChangeManifestText} = useProfileCardTestPage();
  return(
  <div className={style.wrapper}>
    <div className={style.hiddenArea}>
      <div className={style.canvasWrapper}>
        <CanvasScene
          className={style['scene-container']}
          onAfterSceneReady={onAfterSceneReady}
          type={'AVATAR'}
        />
      </div>
    </div>
    <div className={style.forwardLayer}>
      <div className={style.cardWrapper}>
        {cardManifest?<ProfileCard data={cardManifest} userName='userName' avatarImageData={avatarImageData} customMessage='customMessage' handleNextAvatarAction={handleNextAvatarAction}/>:null}
      </div>
      <div className={style.editWrapper}>
        <div className={style.imageFieldWrapper}>
          Image Files : 
          <input type='file' multiple onChange={handleOnChangeImagesField}/>
        </div>
        <div className={style.jsonFieldWrapper}>
          Manifest Json File : 
          <input type='file' onChange={handleOnChangeJsonFileField}/>
          <textarea value={strCardJson}></textarea>
        </div>
      </div>
    </div>
    
    
  </div>);
};
export default ProfileCardTestPage;