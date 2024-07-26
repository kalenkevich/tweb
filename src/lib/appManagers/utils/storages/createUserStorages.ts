/*
 * https://github.com/morethanwords/tweb
 * Copyright (C) 2019-2021 Eduard Kuzmenko
 * https://github.com/morethanwords/tweb/blob/master/LICENSE
 */

import type {Chat, MessagesStickerSet} from '../../../../layer';
import type {Dialog} from '../../appMessagesManager';
import type {User} from '../../appUsersManager';
import {USER_DATABASE_STATE} from '../../../../config/databases/state';
import AppStorage from '../../../storage';

export type StoragesStorages = {
  users: AppStorage<Record<UserId, User>, typeof USER_DATABASE_STATE>,
  chats: AppStorage<Record<ChatId, Chat>, typeof USER_DATABASE_STATE>,
  dialogs: AppStorage<Record<PeerId, Dialog>, typeof USER_DATABASE_STATE>,
  stickerSets: AppStorage<Record<Long, MessagesStickerSet.messagesStickerSet>, typeof USER_DATABASE_STATE>,
};

export default function createUserStorages(dbPostfix: string = '') {
  // here
  const names: (keyof StoragesStorages)[] = ['users', 'chats', 'dialogs', 'stickerSets'];
  const storages: StoragesStorages = {} as any;
  for(const name of names) {
    // @ts-ignore
    storages[name] = new AppStorage({
      ...USER_DATABASE_STATE,
      name: USER_DATABASE_STATE.name + dbPostfix
    }, name);
  }

  return storages;
}
