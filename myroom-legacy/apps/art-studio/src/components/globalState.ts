import type { Nullable } from "@babylonjs/core/types";
import type { Observer } from "@babylonjs/core/Misc/observable";
import { Observable } from "@babylonjs/core/Misc/observable";
import { Scene } from "@babylonjs/core/scene";
import { IEntityInfo } from "./types";
import { EEditorMode } from "@/core/front/editorMode/editorModeBase";

export class GlobalState {
    public onSelectionChangedObservable = new Observable<IEntityInfo>;
    public onNewSceneObservable = new Observable<Scene>();
    public onForceRefreshUIObservable = new Observable<void>();
    public blockMutationUpdates = false;

    public editorMode: EEditorMode = EEditorMode.None;
}