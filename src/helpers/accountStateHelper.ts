import App from '../config/app';
import {State, STATE_INIT} from '../config/state';
import {StateStorage} from '../lib/storages/state';
import {SessionStorage} from '../lib/storages/session';
import {LogTypes, logger} from '../lib/logger';
import {recordPromiseBound} from './recordPromise';

export type UserSessionData = {
  user_auth: string;
  state_id: string;
  k_build: string;
  auth_key_fingerprint: string;
}

// export async function assignCurrentStateToUser(userId: string | number) {
//   const stateStorage = StateStorage.getInstance();
//   const keyPrefix = `${userId}.`;
//   const ALL_KEYS = Object.keys(STATE_INIT) as any as Array<keyof State>;

//   await Promise.all(
//     ALL_KEYS
//     .map((key) => stateStorage.get(key).then(v => stateStorage.set({[keyPrefix + key]: v})))
//     .concat( // support old webk format
//       stateStorage.get('user_auth').then(v => stateStorage.set({[keyPrefix + `user_auth_legacy`]: v}))
//     )
//     .concat(
//       sessionStorage.get('user_auth').then(v => sessionStorage.set({[keyPrefix + 'user_auth']: v})),
//       sessionStorage.get('state_id').then(v => sessionStorage.set({[keyPrefix + 'state_id']: v})),
//       sessionStorage.get('k_build').then(v => sessionStorage.set({[keyPrefix + 'k_build']: v})),
//       sessionStorage.get('auth_key_fingerprint').then(v => sessionStorage.set({[keyPrefix + 'auth_key_fingerprint']: v})),
//       sessionStorage.get(`dc${App.baseDcId}_auth_key`).then(v => sessionStorage.set({[keyPrefix + `dc${App.baseDcId}_auth_key`]: v}))
//     )
//   );
// }

// export async function pruneUserState(userId: string | number) {
//   const stateStorage = StateStorage.getInstance();
//   const keyPrefix = `${userId}.`;
//   const log = logger('APP-ACCOUNT-MANAGER', LogTypes.Error);
//   const recordPromise = recordPromiseBound(log);
//   const ALL_KEYS = Object.keys(STATE_INIT) as any as Array<keyof State>;

//   await Promise.all(
//     ALL_KEYS
//     // @ts-ignore
//     .map((key) => recordPromise(sessionStorage.delete(keyPrefix + key), 'state ' + key))
//     .concat(
//       // @ts-ignore
//       recordPromise(sessionStorage.delete(keyPrefix + 'user_auth'), 'auth'),
//       // @ts-ignore
//       recordPromise(sessionStorage.delete(keyPrefix + 'state_id'), 'auth'),
//       // @ts-ignore
//       recordPromise(sessionStorage.delete(keyPrefix + 'k_build'), 'auth'),
//       // @ts-ignore
//       recordPromise(sessionStorage.delete(keyPrefix + 'auth_key_fingerprint'), 'auth'),
//       // @ts-ignore
//       recordPromise(sessionStorage.delete(keyPrefix + `dc${App.baseDcId}_auth_key`), 'auth')
//     )
//     .concat( // support old webk format
//       // @ts-ignore
//       recordPromise(stateStorage.delete(keyPrefix + 'user_auth_legacy'), 'old auth')
//     )
//   );
// }

// export async function rebaseSessionStateToUser(userId: string | number) {
//   const stateStorage = StateStorage.getInstance();
//   const keyPrefix = `${userId}.`;
//   const log = logger('APP-ACCOUNT-MANAGER', LogTypes.Error);
//   const recordPromise = recordPromiseBound(log);
//   const ALL_KEYS = Object.keys(STATE_INIT) as any as Array<keyof State>;

//   await Promise.all(
//     ALL_KEYS
//     // @ts-ignore
//     .map((key) => recordPromise(sessionStorage.delete(keyPrefix + key), 'state ' + key))
//     .concat(
//       // @ts-ignore
//       recordPromise(sessionStorage.get(keyPrefix + 'user_auth'), 'auth').then(v => sessionStorage.set({['user_auth']: v})),
//       // @ts-ignore
//       recordPromise(sessionStorage.get(keyPrefix + 'state_id'), 'auth').then(v => sessionStorage.set({['state_id']: v})),
//       // @ts-ignore
//       recordPromise(sessionStorage.get(keyPrefix + 'k_build'), 'auth').then(v => sessionStorage.set({['k_build']: v})),
//       // @ts-ignore
//       recordPromise(sessionStorage.get(keyPrefix + 'auth_key_fingerprint'), 'auth').then(v => sessionStorage.set({['auth_key_fingerprint']: v})),
//       // @ts-ignore
//       recordPromise(sessionStorage.get(keyPrefix + `dc${App.baseDcId}_auth_key`), 'auth').then(v => sessionStorage.set({[`dc${App.baseDcId}_auth_key`]: v}))
//     )
//     .concat( // support old webk format
//       // @ts-ignore
//       recordPromise(sessionStorage.get(keyPrefix + 'user_auth_legacy'), 'old auth').then(v => stateStorage.set(v))
//     )
//   );
// }

// export async function loadSessionData(userId?: string | number): Promise<UserSessionData | undefined> {
//   const sessionData: any = {};
//   const keyPrefix = `${userId}.`;

//   await Promise.all(
//     // @ts-ignore
//     sessionStorage.get(keyPrefix + 'user_auth').then(v => sessionData['user_auth'] = v),
//     // @ts-ignore
//     sessionStorage.get(keyPrefix + 'state_id').then(v => sessionData['state_id'] = v),
//     // @ts-ignore
//     sessionStorage.get(keyPrefix + 'k_build').then(v => sessionData['k_build'] = v),
//     // @ts-ignore
//     sessionStorage.get(keyPrefix + 'auth_key_fingerprint').then(v => sessionData['auth_key_fingerprint'] = v),
//     // @ts-ignore
//     sessionStorage.get(keyPrefix +`dc${App.baseDcId}_auth_key`).then(v => sessionData[`dc${App.baseDcId}_auth_key`] = v)
//   );

//   if(Object.values(sessionData).filter(Boolean).length === 0) {
//     return undefined;
//   }

//   return sessionData;
// }

// export async function runUserSessionStorageMigrationIfNeeded(userId: string) {
//   const currentUserSessionData = await loadSessionData(userId);
//   if(currentUserSessionData) {
//     return;
//   }

//   await assignCurrentStateToUser(userId);
// }

