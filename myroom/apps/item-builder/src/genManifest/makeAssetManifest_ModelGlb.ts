import { IAssetManifest_Model_glb } from '../../../../packages/client-core/assetSystem/jsonTypes/manifest/assetManifest_Model_glb';

export class MakeAssetManifest_ModelGlb implements IAssetManifest_Model_glb
{
    format: number;
    main:
    {
        type: string;
        modelfile: string;
        scale?: number;
        rotAngle?: number;
        playAnim?:
        {
            animationGroupName: string;
            speed: number;
        };
    };

    constructor()
    {
        this.format = 0;
        this.main =
        {
            type: '',
            modelfile: '',
        };
    }
}