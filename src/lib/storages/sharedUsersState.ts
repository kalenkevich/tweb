import {SHARED_DATABASE_STATE} from '../../config/databases/state';
import {User} from '../../layer';
import AppStorage from '../storage';

export class SharedUsersStateStorage extends AppStorage<Record<UserId, User>, typeof SHARED_DATABASE_STATE> {
  private constructor() {
    super(SHARED_DATABASE_STATE, 'users');
  }

  private static instance: SharedUsersStateStorage;

  static getInstance() {
    if(!this.instance) {
      this.instance = new SharedUsersStateStorage();
    }

    return this.instance;
  }
}
