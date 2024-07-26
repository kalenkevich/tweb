/*
 * https://github.com/morethanwords/tweb
 * Copyright (C) 2019-2021 Eduard Kuzmenko
 * https://github.com/morethanwords/tweb/blob/master/LICENSE
 */

import type {ChatSavedPosition} from '../appManagers/appImManager';
import type {AppDraftsManager} from '../appManagers/appDraftsManager';
import type {State} from '../../config/state';
import {LangPackDifference} from '../../layer';
import AppStorage from '../storage';
import {USER_DATABASE_STATE} from '../../config/databases/state';

enum StateStorageMigrationType {
  migrated = 'migrated'
}

type StateStorageType = {
  chatPositions: {
    [peerId_threadId: string]: ChatSavedPosition
  },
  langPack: LangPackDifference,
  drafts: AppDraftsManager['drafts'],
  migration: StateStorageMigrationType,
  user_auth: any, // support old webk format
} & State;

const STATE_KEYS: Array<keyof StateStorageType> = [
  'chatPositions',
  'langPack',
  'drafts',
  'user_auth',
  'migration',
  'allDialogsLoaded',
  'pinnedOrders',
  'contactsListCachedTime',
  'shownUploadSpeedTimestamp',
  'updates',
  'filtersArr',
  'maxSeenMsgId',
  'stateCreatedTime',
  'recentEmoji',
  'recentCustomEmoji',
  'topPeersCache',
  'recentSearch',
  'version',
  'build',
  'authState',
  'hiddenPinnedMessages',
  'settings',
  'playbackParams',
  'keepSigned',
  'chatContextMenuHintWasShown',
  'hideChatJoinRequests',
  'stateId',
  'notifySettings',
  'confirmedWebViews',
  'seenTooltips',
  'hiddenSimilarChannels',
  'appConfig',
  'accountThemes',
  'translations',
  'shownUploadSpeedTimestamp'
];

export class StateStorage extends AppStorage<StateStorageType, typeof USER_DATABASE_STATE> {
  private constructor(dbPostfix: string = '') {
    super({
      ...USER_DATABASE_STATE,
      name: USER_DATABASE_STATE.name + dbPostfix
    }, 'session');
  }

  private static instance: StateStorage;

  static getInstance() {
    if(!this.instance) {
      this.instance = new StateStorage();
    }

    return this.instance;
  }

  static setUserInstance(userId: string) {
    this.instance = new StateStorage(`.${userId}`);
  }

  async getState(): Promise<StateStorageType> {
    const state = {} as StateStorageType;

    await Promise.all(STATE_KEYS.map(key => this.get(key, false).then(v => {
      // @ts-ignore
      state[key] = v;
    })));

    return state;
  }

  static async assignStateToUserIfNeeded(userId: string) {
    const newStorage = new StateStorage(`.${userId}`);
    const alredyMigrated = (await newStorage.get('migration')) === StateStorageMigrationType.migrated;
    if(alredyMigrated) {
      return;
    }

    const fullState = await this.instance.getState();
    await newStorage.set({
      ...fullState,
      migration: StateStorageMigrationType.migrated
    });

    this.instance = newStorage;
  }
}
