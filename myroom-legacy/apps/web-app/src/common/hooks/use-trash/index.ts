import { useCallback, useEffect, useState } from "react";
import { openDB, deleteDB, IDBPDatabase } from 'idb';
import { IMyRoomItemFunctionData } from "client-core/assetSystem/jsonTypes/manifest/assetManifest_MyRoom";


const DATABASE_NAME = "MYROOM_TRASH";
export enum TRASH_TABLES {
    ITEM = "ITEM",
    FIGURE = "FIGURE"
}

export type TrashItem = {
    _id: string;
    itemId?: string;
    functionData: IMyRoomItemFunctionData | null;
}

let db: IDBPDatabase;
const useTrash = () => {
    const [figureList, setFigureList] = useState<TrashItem[]>([]);
    const [itemList, setItemList] = useState<TrashItem[]>([]);

    const init = useCallback(async () => { 
        db = await openDB(DATABASE_NAME, 1, {
            upgrade: (db) => {
                db.createObjectStore(TRASH_TABLES.ITEM);
                db.createObjectStore(TRASH_TABLES.FIGURE);
            }
        });
    }, []);

    const getAll = useCallback(async (type: TRASH_TABLES) => {
        const data = await db.getAll(type);
        if (type === TRASH_TABLES.FIGURE) { 
            setFigureList([...data]);
        }
        else {
            setItemList([...data]);
        }
     }, []);

    const add = useCallback(async (type: TRASH_TABLES, item: TrashItem) => {
        const key = await db.add(type, {
            _id: item._id,
            itemId: item.itemId,
            functionData: item.functionData,
        }, item._id);  

        if (key) {
            if (type === TRASH_TABLES.ITEM) {
                setItemList(prev => [item, ...prev]);
            }
            else {
                setFigureList(prev => [item, ...prev]);
            }
        }
     }, []);

    const remove = useCallback(async (type: TRASH_TABLES, id: string) => { 
        await db.delete(type, id);  

        if (type === TRASH_TABLES.ITEM) {
            setItemList(prev => [...prev.filter(x => x._id !== id)]);
        }
        else {
            setFigureList(prev => [...prev.filter(x => x._id !== id)]);
        }
    }, []);

    const clear = useCallback(async () => {
        await deleteDB(DATABASE_NAME);
    }, []);
    
    useEffect(() => { 
        clear().then(() => { 
            init().then(() => { 
                getAll(TRASH_TABLES.FIGURE);
                getAll(TRASH_TABLES.ITEM);
            });
        });
    }, []);

    return {add, getAll, remove, clear, figureList, itemList}
}

export default useTrash;