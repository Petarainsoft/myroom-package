import {useMutation} from '@tanstack/react-query'
import {AuthRefreshParams, AuthSignupEmailData, AuthEmailParams, AuthSigninEmailData} from './type';
import { postAuthRefesh, postAuthSigninEmail, postAuthSignupEmail } from './fetch';
import {instance} from '@/common/utils/axios';

const useAuthAPI = () => {
    /**
     * 토큰 리프레쉬
     */
    const mutationPostAuthRefresh = useMutation(async (payload:{refreshToken:string, params:AuthRefreshParams})=> await postAuthRefesh(instance, payload.refreshToken, payload.params));

    /**
     * 이메일 가입
     */
    const mutationPostAuthSignupEmail = useMutation(async (payload:{data:AuthSignupEmailData, params?:AuthEmailParams}) => await postAuthSignupEmail(instance, payload.data, payload.params));

    /**
     * 이메일 로그인
     */
    const mutationPostAuthSigninEmail = useMutation(async (payload:{data:AuthSigninEmailData, params?:AuthEmailParams})=> await postAuthSigninEmail(instance, payload.data, payload.params));

    return {mutationPostAuthRefresh, mutationPostAuthSignupEmail, mutationPostAuthSigninEmail}
}

export default useAuthAPI;

