import { ItemData } from "../../../../packages/client-core/tableData/defines/System_Interface";

export enum ERegisteResult
{
    NotyetTryied                = -1,       // 시도안함
    SucceededRegiste            = 0,        // 등록성공
    AlreadyRegisted             = 100,      // 이미 등록됨
    FailedPreBuildItem          = 200,      // 아이템 사전빌드 실패
    FailedBuildItem             = 300,      // 아이템 빌드 실패
    FailedUploadResource        = 400,      // 리소스 등록실패
    FailedRegisteItem           = 500,      // 아이템 등록실패
    FailedDeleteItem            = 600,      // 아이템 갱신실패
}

export class CacheData_ResourceInfo
{
    public fileName:string = "";
    public checksum:string = "";
}

export class CacheData_History
{
    public ID:string;
    public itemStructName:string;
    public metadata:any;
    public resource:CacheData_ResourceInfo[];

    constructor(id:string, itemStructName:string, metadata:any, resource:CacheData_ResourceInfo[])
    {
        this.ID             = id;
        this.itemStructName = itemStructName;
        this.metadata       = metadata;
        this.resource       = resource;
    }
}

export class CacheData_Current extends CacheData_History
{
    public isNeedRegisteItem:boolean; // 아이템 신규등록 필요한가?
    public isNeedUpdateItem:boolean;  // 아이템 업데이트 필요한가?
    public isNeedUploadResource:boolean;  // 리소스 등록이 필요한가?
    public isNeedDeleteItem:boolean;  // 삭제되어야 하는 아이템인가?

    public registeResult:ERegisteResult;  // ERegisteResultType
    public errorString:string;            // registeState.FailedRegiste 일 때 실패이유

    constructor(id:string, itemStructName:string, metadata:any, resource:CacheData_ResourceInfo[])
    {
        super(id, itemStructName, metadata, resource);

        this.isNeedRegisteItem      = false;
        this.isNeedUpdateItem       = false;
        this.isNeedUploadResource   = false;
        this.isNeedDeleteItem       = false;

        this.registeResult = ERegisteResult.NotyetTryied;
        this.errorString = "";
    }
}