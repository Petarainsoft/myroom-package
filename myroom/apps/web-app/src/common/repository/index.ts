
import loki from 'lokijs';
import { Followings } from './models/followings';
import { instance } from '../utils/axios';
import { getMeFollowings } from '@/apis/User/Follow/fetch';

export default class Repository {

    private static _instance: loki = new loki('myroom.db');
    
    public static get followings() {
        return this._instance.getCollection('followings');
    }

    public static async init() {
        this._instance.addCollection<Followings>('followings');

        await this.initFollowings();
    }

    public static clear() {
        
    }

    private static async initFollowings() {
        let isNext = true;
        let page = 1;
        
        const limit = 10;
    
        //TODO: 서버 페이징 버그로 인해 한번만 호출하게끔 했음
        // do {
        //     const result = await getMeFollowings(instance, { page, limit });
            
        //     if (result) {
        //         result.list?.map((item:any) => { 
        //             Repository.followings.insert({id:item._id});
        //         });
            
        //         result.current?.total >= limit * page ? page++ : isNext = false;
        //     }
            
        // } while (isNext);
        
        const result = await getMeFollowings(instance, { page, limit : 200 });
        if (result) {
            result.list?.map((item:any) => { 
                Repository.followings.insert({id:item._id});
            });
        }
    }
}

