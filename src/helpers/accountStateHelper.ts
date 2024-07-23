import App from '../config/app';
import {State, STATE_INIT} from '../config/state';
import stateStorage from '../lib/stateStorage';
import sessionStorage from '../lib/sessionStorage';
import {reloadState} from '../lib/appManagers/utils/state/loadState';
import {LogTypes, logger} from '../lib/logger';
import {recordPromiseBound} from './recordPromise';
import rootScope from '../lib/rootScope';

export type UserSessionData = State & {
  user_auth: string;
  state_id: string;
  k_build: string;
  auth_key_fingerprint: string;
  // [`dc${App.baseDcId}_auth_key`]: string;
}

export async function dumpUserSessionData(userId: string | number) {
  const keyPrefix = `${userId}.`;
  const ALL_KEYS = Object.keys(STATE_INIT) as any as Array<keyof State>;
  const log = logger('APP-ACCOUNT-MANAGER', LogTypes.Error);
  const recordPromise = recordPromiseBound(log);

  await Promise.all(
    ALL_KEYS
    .map((key) => recordPromise(stateStorage.get(key), 'state ' + key).then(v => sessionStorage.set({[keyPrefix + key]: v})))
    .concat(
      recordPromise(sessionStorage.get('user_auth'), 'auth').then(v => sessionStorage.set({[keyPrefix + 'user_auth']: v})),
      recordPromise(sessionStorage.get('state_id'), 'auth').then(v => sessionStorage.set({[keyPrefix + 'state_id']: v})),
      recordPromise(sessionStorage.get('k_build'), 'auth').then(v => sessionStorage.set({[keyPrefix + 'k_build']: v})),
      recordPromise(sessionStorage.get('auth_key_fingerprint'), 'auth').then(v => sessionStorage.set({[keyPrefix + 'auth_key_fingerprint']: v})),
      recordPromise(sessionStorage.get(`dc${App.baseDcId}_auth_key`), 'auth').then(v => sessionStorage.set({[keyPrefix + `dc${App.baseDcId}_auth_key`]: v}))
    )
    .concat( // support old webk format
      recordPromise(stateStorage.get('user_auth'), 'old auth').then(v => sessionStorage.set({[keyPrefix + `user_auth`]: v}))
    )
  );
}

export async function pruneUserState(userId: string | number) {
  const keyPrefix = `${userId}.`;
  const log = logger('APP-ACCOUNT-MANAGER', LogTypes.Error);
  const recordPromise = recordPromiseBound(log);
  const ALL_KEYS = Object.keys(STATE_INIT) as any as Array<keyof State>;

  await Promise.all(
    ALL_KEYS
    // @ts-ignore
    .map((key) => recordPromise(stateStorage.delete(keyPrefix + key), 'state ' + key))
    .concat(
      // @ts-ignore
      recordPromise(sessionStorage.delete(keyPrefix + 'user_auth'), 'auth'),
      // @ts-ignore
      recordPromise(sessionStorage.delete(keyPrefix + 'state_id'), 'auth'),
      // @ts-ignore
      recordPromise(sessionStorage.delete(keyPrefix + 'k_build'), 'auth'),
      // @ts-ignore
      recordPromise(sessionStorage.delete(keyPrefix + 'auth_key_fingerprint'), 'auth'),
      // @ts-ignore
      recordPromise(sessionStorage.delete(keyPrefix + `dc${App.baseDcId}_auth_key`), 'auth')
    )
    .concat( // support old webk format
      // @ts-ignore
      recordPromise(stateStorage.delete(keyPrefix + 'user_auth'), 'old auth')
    )
  );
}

export async function rebaseSessionStateToUser(userId: string | number) {
  const keyPrefix = `${userId}.`;
  const log = logger('APP-ACCOUNT-MANAGER', LogTypes.Error);
  const recordPromise = recordPromiseBound(log);
  const ALL_KEYS = Object.keys(STATE_INIT) as any as Array<keyof State>;

  await Promise.all(
    ALL_KEYS
    // @ts-ignore
    .map((key) => recordPromise(stateStorage.delete(keyPrefix + key), 'state ' + key))
    .concat(
      // @ts-ignore
      recordPromise(sessionStorage.get(keyPrefix + 'user_auth'), 'auth').then(v => sessionStorage.set({['user_auth']: v})),
      // @ts-ignore
      recordPromise(sessionStorage.get(keyPrefix + 'state_id'), 'auth').then(v => sessionStorage.set({['state_id']: v})),
      // @ts-ignore
      recordPromise(sessionStorage.get(keyPrefix + 'k_build'), 'auth').then(v => sessionStorage.set({['k_build']: v})),
      // @ts-ignore
      recordPromise(sessionStorage.get(keyPrefix + 'auth_key_fingerprint'), 'auth').then(v => sessionStorage.set({['auth_key_fingerprint']: v})),
      // @ts-ignore
      recordPromise(sessionStorage.get(keyPrefix + `dc${App.baseDcId}_auth_key`), 'auth').then(v => sessionStorage.set({[`dc${App.baseDcId}_auth_key`]: v}))
    )
    .concat( // support old webk format
      // @ts-ignore
      recordPromise(sessionStorage.get(keyPrefix + 'user_auth'), 'old auth').then(v => stateStorage.set(v))
    )
  );
}

export async function loadSessionData(userId?: string | number): Promise<UserSessionData | undefined> {
  return;
}

export async function runUserSessionStateMigrationIfNeeded() {
  const currentUser = await rootScope.managers.appUsersManager.getSelf();
  const currentUserSessionData = await loadSessionData(currentUser.id);
  if(currentUserSessionData) {
    return;
  }

  await dumpUserSessionData(currentUser.id);
}

