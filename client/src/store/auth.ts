import { atom } from 'jotai';

export type AuthStatus = 'guest' | 'authenticated';

// 登录态：M2 账号体系未实现，默认游客；登录成功后置为 'authenticated'
export const authAtom = atom<AuthStatus>('guest');