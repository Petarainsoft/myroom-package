import { AUTH_API_KEY, AUTH_SERVER_URL } from '@/common/constants';
// import { IAuth, AuthConfig, Credential } from '@colorverse/auth';



// const REFRESH_TOKEN_NAME = "REFRESH_TOKEN";

export const ACCESS_TOKEN: string | null = null;
export const ACCESS_TOKEN_EXPIRES: number = 0;

// class Auth implements IAuth {
//     config: AuthConfig;

//     constructor(config: AuthConfig) {
//         this.config = config;
//     }

//     isLogined() {
//         return ACCESS_TOKEN !== null;
//     }

//     getRefreshToken() {
//         const token = Cookies.get(REFRESH_TOKEN_NAME);
//         return token ? token : null;
//     }

//     setCredential(credential: Credential) {

//         ACCESS_TOKEN = credential.accessToken;
//         console.log("_setCredential _ACCESS_TOKEN", ACCESS_TOKEN);

//         // 딜레이 시간을 고려하여 -5초를 줄여 expire 설정
//         ACCESS_TOKEN_EXPIRES = now().add(credential.expires - 5, 'second').valueOf();
//         if (credential.refreshToken) {
//             Cookies.set(REFRESH_TOKEN_NAME, credential.refreshToken, { secure: false, expires: now().add(1, 'year').toDate() });
//         }
//     }

//     clearCredential() {
//         ACCESS_TOKEN = null;
//         ACCESS_TOKEN_EXPIRES = 0;
//         Cookies.remove(REFRESH_TOKEN_NAME);
//     }

//     decodeCredential() {
//         const jwt = ACCESS_TOKEN;
//         if (jwt) {
//             const base64Url = jwt.split('.')[1];
//             const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
//             const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
//                 return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
//             }).join(''));

//             return JSON.parse(jsonPayload);
//         }
//         else {
//             return null
//         }
//     }
// }


class Auth {
    config: any;

    constructor(config: any) {
        this.config = config;
    }

    isLogined(): boolean {
        return true;
    }

    getRefreshToken(): string | null {
        return null;
    }

    setCredential(): void {
        // Do nothing
    }

    clearCredential(): void {
        // Do nothing
    }

    decodeCredential(): any | null {
        return null;
    }
}


export const auth = new Auth({
    apiKey: AUTH_API_KEY,
    redirectUri:  `${location.origin}/auth/_callback`,
    url: AUTH_SERVER_URL,
    debug: true
});