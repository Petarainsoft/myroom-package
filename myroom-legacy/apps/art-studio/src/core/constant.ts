
export class EditorConstants {
    //-----------------------------------------------------------------------------------
    // IPC Channels
    //-----------------------------------------------------------------------------------
    static readonly IPC_CHANNEL_LOGGER_LOG = "editor:logger:log";
    static readonly IPC_CHANNEL_LOGGER_ERROR = "editor:logger:error";
    static readonly IPC_CHANNEL_LOGGER_WARN = "editor:logger:warn";

    static readonly IPC_CHANNEL_SET_EDITOR_MODE = "editor:set-editor-mode";

    static readonly IPC_CHANNEL_TOGGLE_DEBUG_LAYER = "editor:menu:toggle-debug-layer";

    static readonly IPC_CHANNEL_SAVE = "editor:file:saveAll";

    static readonly NODE_MATERIAL_NAME_AVATAR = "AvatarSkinNodeMaterial";
    static readonly NODE_MATERIAL_NAME_MYROOM_SKIN_WATER = "MyroomSkinWaterNodeMaterial";
}