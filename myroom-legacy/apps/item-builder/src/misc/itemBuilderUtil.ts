import fs from 'fs';
import archiver from 'archiver';
import path from 'path';
import crypto from 'crypto';

import { EItemCategory1 } from "../../../../packages/client-core/tableData/defines/System_Enum";
import { ItemCategory3, ItemData } from "../../../../packages/client-core/tableData/defines/System_Interface";
import { ItemBuilderErrorThen } from './itemBuilderErrorThen';
import { CacheData_ResourceInfo } from '../buildCache/defineBuildCache';


export class ItemBuilderUtil
{
    private static FOLDERNAME_ITEM:string = "ITEM";
    private static FOLDERNAME_AVATAR:string = "AVATAR";
    private static FOLDERNAME_ROOM:string = "ROOM";

    public static async removeDirectory(root:string)
    {
        try
        {
            const isExists = fs.existsSync(root);
            if(isExists)
            {
                await fs.rmSync( root, { recursive: true } );
            }
        }
        catch (error)
        {
            const errmsg = 'removeDirectory() : ' + error;
            console.error(errmsg);
            throw errmsg;
        }
    }

    public static makeDirectories(root:string)
    {
        try
        {
            const isExists = fs.existsSync(  root );
            if( isExists )
            {
                fs.rmSync( root, { recursive: true } );
            }
    
            fs.mkdirSync( root, { recursive: true } );
        }
        catch (error)
        {
            const errmsg = 'makeDirectories() : ' + error;
            console.error(errmsg);
            throw errmsg;
        }
    }

    public static isExistPath(path: string): boolean
    {
        return fs.existsSync(path);
    }

    public static copyFiles(srcRoot: string, dstRoot: string): boolean
    {
        const isExists = fs.existsSync(srcRoot);
        if (!isExists)
        {
            const msg = `copyFiles() Invalid source root. => ${srcRoot}`;
            console.error(msg);
            return false;
        }

        const files = fs.readdirSync(srcRoot);
      
        for (const file of files)
        {
            const sourcePath = path.join(srcRoot, file);
            const destinationPath = path.join(dstRoot, file);

            const stats = fs.statSync(sourcePath);
        
            if (stats.isFile())
            {
                fs.copyFileSync(sourcePath, destinationPath);
                if (!fs.existsSync(destinationPath))
                    return false;
            }
            // else if (stats.isDirectory())
            // {
            //     fs.mkdirSync(destinationPath, { recursive: true });
            //     await this.copyFiles(sourcePath, destinationPath);
            // }
        }

        return false;
    }

    public static readFile(filePath: string): Promise<string>
    {
        return new Promise<string>((resolve, reject) => 
        {
            fs.
            readFile(filePath, { flag: 'r', encoding: 'utf8' }, (error, data) =>
            {
                if (error) 
                {
                    reject(error);
                } 
                else
                {
                    resolve(data);
                }
            });
        });
    }

    public static writeFile(filePath: string, data: string): Promise<void>
    {
        return new Promise<void>((resolve, reject) =>
        {
            fs.writeFile(filePath, data, { flag: 'w', encoding: 'utf8' }, error =>
            {
                if (error)
                {
                    reject(error);
                }
                else
                {
                    resolve();
                }
            });
        });
    }

    public static getFolderName(targetItem:ItemData, category3:ItemCategory3|null):string
    {
        try
        {
            let typeName:string = "";
            const category1:number = +targetItem.category1;


            // 현재 ItemTable의 모든 데이터는 모델이므로 Item으로 강제
            typeName = this.FOLDERNAME_ITEM;
            if (false)
            {
                switch (category1)
                {
                    case EItemCategory1.AVATAR:     typeName = this.FOLDERNAME_AVATAR; break;
                    case EItemCategory1.MYROOMSKIN: typeName = this.FOLDERNAME_ROOM; break;
                    case EItemCategory1.MYROOMITEM: typeName = this.FOLDERNAME_ITEM; break;
                    default:
                        {
                            const msg = `ItemBuilder::getFolderName() Not implemented Category1 => ${targetItem.category1}`;
                            console.error("[ERROR] : " + msg);
                            
                            if (ItemBuilderErrorThen.NOT_IMPLEMENTED_CATEGORY1_THEN_THROW)
                                process.exit(1);
                            else
                                return "";
                        }
                }
            }

            const subFolderName = targetItem.client_itemid;
            if (!subFolderName)
            {
                const msg = `ItemBuilder::getFolderName() client_itemid is empty. item_id='${targetItem.ID}'`;
                throw msg;
            }

            if (!category3)
            {
                const msg = `ItemBuilder::getFolderName() Invalid ItemCategory3. item_id='${targetItem.ID}', category3='${targetItem.category3}'`;
                throw msg;
            }

            const rootFolderName = category3.SvnFolder;
            if (!rootFolderName)
            {
                const msg = `ItemBuilder::getFolderName() Invalid ItemCategory3.svnFolder. item_id='${targetItem.ID}', category3='${category3.ID}'`;
                throw msg;
            }
    
            return path.join(typeName, rootFolderName, subFolderName);
        }
        catch (error)
        {
            console.log("[ERROR] : " + error);
            //process.exit(1);
        }

        return "";
    }

    public static async getFileList(root: string): Promise<string[]> 
    {
        const files: string[] = [];
        
        const entries = fs.readdirSync(root, { withFileTypes: true });
        for (const entry of entries)
        {
            //const fullPath = path.join(root, entry.name);
            if (entry.isFile())
            {
                files.push(entry.name);
            }
            // else if (entry.isDirectory())
            // {
            //     const nestedFiles = this.getFileList(fullPath);
            //     files.push(...nestedFiles);
            // }
        }
        
        return files;
    }

    public static async createZipFile(sourcePath: string, destinationPath: string): Promise<void>
    {
        console.log(`ItemBuilderUtil::createZipFile() sourcePath='${sourcePath}', destinationPath='${destinationPath}'`);
        
        return new Promise<void>((resolve, reject) =>
        {
            const output = fs.createWriteStream(destinationPath);
            const archive = archiver('zip', { zlib: { level: 9 } });
        
            output.on('close', () =>
            {
                resolve();
            });
        
            archive.on('error', (error: any) => {
                reject(error);
            });
        
            archive.pipe(output);
            archive.directory(sourcePath, false);
            archive.finalize();
        });
    }
    
    public static makeChecksumList(root:string): CacheData_ResourceInfo[]|null
    {
        if (!ItemBuilderUtil.isExistPath(root))
            return null;

        const arr:CacheData_ResourceInfo[] = [];

        const entries = fs.readdirSync(root, { withFileTypes: true });
        for (const entry of entries)
        {
            if (entry.isFile())
            {
                const fullPath = path.join(root, entry.name);
                const checksum = this.getCalculatedChecksum(fullPath);
                if (!checksum)
                {
                    return null;
                }

                let info = new CacheData_ResourceInfo();
                info.fileName = entry.name;
                info.checksum = checksum;

                arr.push(info);
            }
            // else if (entry.isDirectory())
            // {
            //     const nestedFiles = this.getFileList(fullPath);
            //     files.push(...nestedFiles);
            // }
        }

        return arr;
    }
    
    public static getCalculatedChecksum(filePath:string): string
    {
        try
        {
            const fileData = fs.readFileSync(filePath);
            const hash = crypto.createHash('sha256');
            hash.update(fileData);
    
            return hash.digest('hex');
        }
        catch (error)
        {
            console.error(`ItemBuilderUtil::getCalculatedChecksum() ${error}, filePath='${filePath}'`);
        }

        return "";
    }
}