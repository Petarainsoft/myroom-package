import { CommonResponse } from "@/apis/_common/type";


export type AuthRefreshParams = {
    w?: string;
    p?:string;
}

export type AuthEmailParams = {
    w?: string;
    p?:string;
}

export type AuthSignupEmailData = {
    email:string;
    id:string;
    password:string;
}

export type AuthSigninEmailData = {
    id:string;
    password:string;
}


export type AuthTokenParams = {
    w?: string;
}

export type AuthTokenData = {
    grant_type: "code";
    request_uri: string;
    code_verifier: string;
    client_id: string;
    code : string;
}

export type AuthSignupEmailResponse = CommonResponse & {
    credential: {
      access_token: string,
      expires: number,
      refresh_token: string,
      token_type: "Bearer"
    }
}

export type AuthSigninEmailResponse =  CommonResponse & {
    credential: {
      access_token: string,
      expires: number,
      refresh_token: string,
      token_type: "Bearer"
    }
}

export type AuthRefreshResponse = CommonResponse & {
    credential: {
        access_token: string,
        expires: number,
        refresh_token: string,
        token_type: "Bearer"
    }
}