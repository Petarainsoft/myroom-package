import { Engine } from '@babylonjs/core/Engines/engine'
import { Scene } from '@babylonjs/core/scene'
import myRoom from './scenes/myRoom'
import artStudio from './scenes/artStudio'

export const sceneList = [
    {
        name: "myRoom",
        component: myRoom,
    },
    {
        name: "artStudio",
        component: artStudio,
    }
]

export interface CreateSceneClass {
    createScene: (engine: Engine, canvas: HTMLCanvasElement) => Promise<Scene>
    preTasks?: Promise<unknown>[]
}

export interface CreateSceneModule {
    default: CreateSceneClass
}

export const getSceneModuleWithName = (
    name = 'myRoom'
): CreateSceneClass => {

    const scene = sceneList.find(scene => scene.name === name)

    return scene ? scene.component : myRoom

    // return require(/* @vite-ignore */'./scenes/' + name).then((module: CreateSceneModule) => {
    //     return module.default
    // })

    // To build quicker, replace the above return statement with:

    // return import('./scenes/defaultWithTexture').then((module: CreateSceneModule)=> {
    //     return module.default;
    // });
};

