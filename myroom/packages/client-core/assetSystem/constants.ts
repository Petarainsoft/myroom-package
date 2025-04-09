import { MYROOM_APP_ENV } from 'client-core/common/environment';
import { MYROOM_APP_AUTH_SERVER__API } from 'client-core/common/environment';
import { MYROOM_APP_AUTH_SERVER__PUBLIC } from 'client-core/common/environment';
import { MYROOM_APP_AUTH_API_KEY } from 'client-core/common/environment';
import { MYROOM_APP_WORLD_ID } from 'client-core/common/environment';

export class Constants {
    public static readonly DEV_ENV = MYROOM_APP_ENV;
    public static readonly BASEURL_API = MYROOM_APP_AUTH_SERVER__API;
    public static readonly BASEURL_PUBLIC = MYROOM_APP_AUTH_SERVER__PUBLIC;
    public static readonly TEST_WORLD_ID = MYROOM_APP_WORLD_ID;
    public static readonly TEST_API_KEY = MYROOM_APP_AUTH_API_KEY;

    /** item : 에셋로더에서 Loading후 재 참조를 위해 보관하는 타입 (브라우저 상황에서는 짧게 잡는게 좋을듯. 1시간내에 version이 바뀔일은 크지 않으니) */
    public static readonly LOADED_ASSET_LIFETIME = 60 * 60 * 1000; //60분

    /** Asset Package Infomation File Name */
    public static readonly ASSET_PACKAGE_INFO_FILENAME = "package.json";

    /** Manifest File Name */
    public static readonly MANIFEST_FILENAME = "manifest.json";

    public static readonly THUMBNAIL_FILENAME = "thumbnail.png";

    public static readonly POSTASSETS_FILENAME_WHEN_PROB = "postAssets_when_prob.json";
    public static readonly POSTASSETS_FILENAME_WHEN_PARTS = "postAssets_when_parts.json";
    public static readonly POSTASSETS_FILENAME_WHEN_ANIM = "postAssets_when_anim.json";

    /** Item Index Path Sperator */
    public static readonly ITEM_INDEX_PATH_SEPERATOR = "/";

    /** Skybox Material Name */
    public static readonly SKYBOX_MTL_NAME = "skyBox";

    /** Skybox Mesh Name */
    public static readonly SKYBOX_MESH_NAME = "hdrSkyBox";

    /** HemiSpheric Light Name */
    public static readonly HEMI_SPHERIC_LIGHT_NAME = "[hemi spheric light]";

    /** directional Light Name */
    public static readonly DIRECTIONAL_LIGHT_NAME = "[sun]";

    /** MyRoom Grid Unit Size */
    public static readonly MYROOM_GRID_UNIT_SIZE = 0.25;
    public static readonly MYROOM_FIGURE_GRID_UNIT = 2; //0.25 x 0.25
    public static readonly MYROOM_AVATAR_GRID_UNIT = 4; //0.5 x 0.5
    public static readonly MYROOM_GRID_MARK_MAX_COUNT = 4;
    public static readonly MYROOM_SKIN_MESH_ROOT = "[Room Skin]";

    /** MyRoom Ground Wall Size */
    public static readonly MYROOM_FLOOR_SIZE_METER = 5; //사이즈 달라진다 ㅠㅠ
    //public static readonly MYROOM_WALL_HEIGHT_METER = 5;

    /** RoomObject Cursor 및 Pivot */
    public static readonly ROOMOBJECT_CURSOR_SCREEN_SPACE_DIFF = 100;
    public static readonly ROOMOBJECT_PIVOIT_FROM_CURSOR_METER = 1;
    public static readonly ROOMOBJECT_FUNCTION_IMAGE_TARGET_MATERIAL_NAME = "MATERIALFORIMGOUTPUT";

    /** 피규어 Costomization 관련 */
    public static readonly FIGURE_CUSTOMIZATION_SKINCOLOR_NAME = "Skin Color";
    public static readonly FIGURE_CUSTOMIZATION_HAIRCOLOR_NAME = "Hair Color";

    // iframe (예:youtube) 3d play용 mesh 이름
    public static readonly IFRAME_3D_PLANE_NAME = "_IFRAME_PLANE_";

    // room 로딩시, item/figure의 생성 animation 여부
    public static readonly PLAY_LOADING_ANIMATION_ITEM = true;
    public static readonly PLAY_LOADING_ANIMATION_ROOM = true;
    public static readonly PLAY_LOADING_ANIMATION_FIGURE = false;
    public static readonly PLAY_LOADING_ANIMATION_OUTSIDE = true;
    public static readonly PLAY_LOADING_FRAME = 30;
    public static readonly PLAY_LOADING_ANIMATION_SPEED = this.PLAY_LOADING_FRAME * 1;
    public static readonly EACH_LOADING_BASE_WAIT_TIME = 25;

    // figure의 idle animation을 위한 시간 간격
    public static readonly IDLE_ANIMATION_TIME_GAP_MIN = 2000;
    public static readonly IDLE_ANIMATION_TIME_GAP_MAX = 4000;

    public static readonly USE_IDLE_ANIMATION_TIME_GAP = true;

    public static readonly USE_BLOB = true;

    // camera sheet에서 사용하는 sceneType 이름
    public static readonly SCENE_TYPE_MYROOM = "MyRoom";
    public static readonly SCENE_TYPE_PLACEMODE = "PlaceMode";
    public static readonly SCENE_TYPE_AVATAR = "Avartar";
    public static readonly SCENE_TYPE_STATUSMESSAGE = "StatusMessage";
    public static readonly SCENE_TYPE_AVATAR_CUSTOMIZING = "AvatarCustomizing";
    public static readonly SCENE_TYPE_ITEM = "Item";
    public static readonly SCENE_TYPE_JOYSAM = "Joysam";
    public static readonly SCENE_TYPE_THUMBNAIL = "Thumbnail";
    public static readonly SCENE_TYPE_KHCONV = "KHConv";

    public static readonly SCENE_TYPE_SUFFIX_WIDE = "-wide";

    public static readonly ICON_GENERATOR_EXIT_CODE_SKIP = 100;
    public static readonly ICON_GENERATOR_FILE_NAME = "icon-generator.exe";
}