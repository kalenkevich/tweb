/*
 * https://github.com/morethanwords/tweb
 * Copyright (C) 2019-2021 Eduard Kuzmenko
 * https://github.com/morethanwords/tweb/blob/master/LICENSE
 */

import type {AppInstance} from '../mtproto/singleInstance';
import type {UserAuth} from '../mtproto/mtproto_config';
import type {DcId} from '../../types';
import LocalStorageController from '../localStorage';

enum SessionStateMigrationType {
  migrated = 'migrated'
}

export interface SessionState {
  dc: DcId,
  user_auth: UserAuth,
  state_id: number,
  dc1_auth_key: string,
  dc2_auth_key: string,
  dc3_auth_key: string,
  dc4_auth_key: string,
  dc5_auth_key: string,
  dc1_server_salt: string,
  dc2_server_salt: string,
  dc3_server_salt: string,
  dc4_server_salt: string,
  dc5_server_salt: string,
  auth_key_fingerprint: string, // = dc${App.baseDcId}_auth_key.slice(0, 8)
  server_time_offset: number,
  xt_instance: AppInstance,
  kz_version: 'K' | 'Z',
  tgme_sync: {
    canRedirect: boolean,
    ts: number
  },
  k_build: number,
  migration: SessionStateMigrationType;
}

const STATE_KEYS: Array<keyof SessionState> = [
  'dc',
  'user_auth',
  'state_id',
  'dc1_auth_key',
  'dc2_auth_key',
  'dc3_auth_key',
  'dc4_auth_key',
  'dc5_auth_key',
  'dc1_server_salt',
  'dc2_server_salt',
  'dc3_server_salt',
  'dc4_server_salt',
  'dc5_server_salt',
  'auth_key_fingerprint',
  'server_time_offset',
  'xt_instance',
  'kz_version',
  'tgme_sync',
  'k_build',
  'migration'
];

export class SessionStorage extends LocalStorageController<SessionState> {
  private constructor(private readonly prefix: string = '') {
    super();
  }

  static instance: SessionStorage;
  static getInstance() {
    if(!this.instance) {
      this.instance = new SessionStorage();
    }

    return this.instance;
  }

  static setUserInstance(userId: string) {
    this.instance = new SessionStorage(`${userId}.`);
  }

  static resetInstance() {
    this.instance = new SessionStorage();
  }

  async getState(): Promise<SessionState> {
    const state = {} as SessionState;

    await Promise.all(STATE_KEYS.map(key => this.get(key).then(v => {
      // @ts-ignore
      state[key] = v;
    })));

    return state;
  }

  public get<T extends keyof SessionState>(key: T, useCache?: boolean) {
    return super.get((this.prefix + key.toString()) as T, useCache);
  }

  public set(obj: Partial<SessionState>, onlyLocal?: boolean) {
    const updatedObj: Partial<SessionState> = Object.keys(obj).reduce((res: any, k: string) => {
      res[this.prefix + k] = obj[k as keyof SessionState];

      return res;
    }, {});

    return super.set(updatedObj, onlyLocal);
  }

  public delete(key: keyof SessionState, saveLocal?: boolean) {
    // @ts-ignore
    return super.delete(this.prefix + key, saveLocal);
  }

  static async assignStateToUserIfNeeded(userId: string) {
    const newStorage = new SessionStorage(`${userId}.`);
    const alreadyMigrated = (await newStorage.get('migration')) === SessionStateMigrationType.migrated;
    if(alreadyMigrated) {
      return;
    }

    const fullState = await this.instance.getState();
    await newStorage.set({
      ...fullState,
      migration: SessionStateMigrationType.migrated
    });

    this.instance = newStorage;
  }

  static async setUserStateAsCurrent(userId: string) {
    const userStorage = new SessionStorage(`${userId}.`);
    const currentStateStorage = new SessionStorage();
    const userFullState = await userStorage.getState();
    await currentStateStorage.set(userFullState);
  }
}
