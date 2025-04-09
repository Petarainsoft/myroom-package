import { atom } from "jotai";
import { ChangeEvent } from "react";



export type InputHelperState = {
    mention?: string;
    nick?: string;
    text?: string;
    thumbnail?: string;
    onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
    onClick?: (text:string) => Promise<void>;
}


export const inputHelperStateAtom = atom<InputHelperState | null>(null);
