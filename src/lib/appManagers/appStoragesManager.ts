/*
 * https://github.com/morethanwords/tweb
 * Copyright (C) 2019-2021 Eduard Kuzmenko
 * https://github.com/morethanwords/tweb/blob/master/LICENSE
 */

import {AppManager} from './manager';
import createUserStorages from './utils/storages/createUserStorages';
import loadStorages from './utils/storages/loadStorages';

export class AppStoragesManager extends AppManager {
  private storages: ReturnType<typeof createUserStorages>;

  public createStorages(userId: string) {
    if(this.storages) {
      return;
    }

    this.storages = createUserStorages(`.${userId}`);
  }

  public loadStorages(userId: string) {
    this.createStorages(userId);

    return loadStorages(this.storages);
  }

  public reloadStorages(userId: string) {
    this.storages = createUserStorages(`.${userId}`);

    return loadStorages(this.storages);
  }

  public async loadStorage<T extends keyof AppStoragesManager['storages']>(userId: string, name: T) {
    return this.loadStorages(userId).then((storagesResults) => {
      return {
        storage: this.storages[name],
        results: storagesResults[name]
      };
    });
  }
}
