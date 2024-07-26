import {AppManager} from './manager';
import {User} from '../../layer';

export const MAX_ACCOUNTS_FOR_NON_PREMIUM_USER = 3;

export default class AppUserAccountManager extends AppManager {
  private userAccountsMap: Record<string | number, User.user> = {};
  private currentUserId: string | number;

  protected async after() {
    this.rootScope.addEventListener('logging_out', this.logoutFromCurrentAccount);
    this.rootScope.addEventListener('state_synchronized', async() => {
      const user = this.appUsersManager.getSelf();
      this.currentUserId = user.id;
      await this.loadUsersFromState();
    });
  }

  async addUserAccount(user: User.user) {
    const existingUser = this.getUser(user.id);
    if(existingUser) {
      return;
    }

    return this.saveUserAccount(user);
  }

  async switchToAccount(userId: string | number) {
    const user = this.getUser(userId);
    if(!user || user.id === this.currentUserId) {
      return;
    }

    // await this.rebaseSessionStateToUser(userId);
    await this.apiManager.setUser(user);
    // await reloadState();
    this.rootScope.premium = this.rootScope.getPremium();
    const currentUser = this.appUsersManager.getSelf();
    this.currentUserId = currentUser.id;

    // change i18n if needed
    (await import('../../pages/pageIm')).default.mount();
  }

  async logoutFromCurrentAccount() {
    return this.logoutFromAccount(this.currentUserId);
  }

  async logoutFromAccount(userId: string | number) {
    // await this.removeUserAccount(userId);
    if(userId !== this.currentUserId) {
      return;
    }

    const otherAccounts = Object.values(this.userAccountsMap);
    if(otherAccounts.length === 0) {
      return;
    }

    return this.switchToAccount(otherAccounts[0].id);
  }

  getCurrentUser(): User.user {
    const user = this.appUsersManager.getSelf();

    return user;
    // return this.getAccount(user.id);
  }

  getCurrentUserId(): string {
    return this.currentUserId.toString();
  }

  getAccountList(): User.user[] {
    return [this.getCurrentUser()];
  }

  private saveUserAccount(user: User.user): void {
    const key = user.id;
    this.userAccountsMap[key] = user;

    // return this.dumpUserState(key);
  }

  private removeUserAccount(userId: string | number): void {
    delete this.userAccountsMap[userId];
    // return this.pruneUserState(userId);
  }

  private getUser(userId: string | number): User.user | undefined {
    return this.userAccountsMap[userId];
  }

  public canAddAccount(): boolean {
    if(this.rootScope.premium) {
      return true;
    }
    const currentAmount = Object.keys(this.userAccountsMap).length;

    return currentAmount <= MAX_ACCOUNTS_FOR_NON_PREMIUM_USER;
  }

  private async loadUsersFromState(): Promise<void> {
    return;
  }
}
