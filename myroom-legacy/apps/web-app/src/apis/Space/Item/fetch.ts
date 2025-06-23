import onRequest, { RequestInstance } from "@/common/utils/fetch";
import { ItemInstanceRes, InstanceDataTypeReq } from "./type";

export async function getItemInstance(instance: RequestInstance) {
    return await onRequest<ItemInstanceRes>(instance, `/v1/space/item-instances/id`, { method: "GET", headers: { "accept": " application/json", "Content-Type": "application/json" } });
}

export async function getItemInstanceById(instance: RequestInstance, id: string) {
    return await onRequest<ItemInstanceRes>(instance, `/v1/space/item-instances/${id}`, { method: "GET", headers: { "accept": " application/json", "Content-Type": "application/json" } });
}

/**
 * @param instance 
 * @param instanceData 없을 경우 자동생성
 * @returns 
 */
export async function postItemInstance(instance: RequestInstance, instanceData: InstanceDataTypeReq) {
    return await onRequest<ItemInstanceRes>(instance, `/v1/space/item-instances`, {
        data: instanceData,
        method: "POST",
        headers: {
            "accept": " application/json", "Content-Type": "application/json"
        }
    });
}

/**
 * @param instance 
 * @param instanceId
 * @returns 
 */
export async function patchItemInstance(instance: RequestInstance, instanceId: string) {
    return await onRequest<ItemInstanceRes>(instance, `/v1/space/item-instances/${instanceId}`, {
        method: "PATCH",
        headers: {
            "accept": " application/json", "Content-Type": "application/json"
        }
    });
}

