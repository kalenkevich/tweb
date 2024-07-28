/*
 * https://github.com/morethanwords/tweb
 * Copyright (C) 2019-2021 Eduard Kuzmenko
 * https://github.com/morethanwords/tweb/blob/master/LICENSE
 */

import blurActiveElement from '../helpers/dom/blurActiveElement';
import loadFonts from '../helpers/dom/loadFonts';
import I18n from '../lib/langPack';
import {AuthAuthorization} from '../layer';
import rootScope from '../lib/rootScope';
import Page from './page';
import {SessionStorage} from '../lib/storages/session';
import {StateStorage} from '../lib/storages/state';
import {SharedUsersStateStorage} from '../lib/storages/sharedUsersState';
import {SignInFlowOptions, SignInFlowType} from './signInFlow';
import apiManagerProxy from '../lib/mtproto/mtprotoworker';

const onFirstMount = (options: SignInFlowOptions, auth?: AuthAuthorization.authAuthorization) => {
  if([
    SignInFlowType.addUserSignIn,
    SignInFlowType.firstUserSignIn
  ].includes(options.type)) {
    rootScope.managers.appStateManager.pushToState('authState', {_: 'authStateSignedIn'});
  }

  if(!I18n.requestedServerLanguage) {
    I18n.getCacheLangPack().then((langPack) => {
      if(langPack.local) {
        I18n.getLangPack(langPack.lang_code);
      }
    });
  }

  page.pageEl.style.display = '';

  blurActiveElement();

  return Promise.all([
    import('../lib/appManagers/appDialogsManager'),
    loadFonts()/* .then(() => new Promise((resolve) => window.requestAnimationFrame(resolve))) */,
    'requestVideoFrameCallback' in HTMLVideoElement.prototype ? Promise.resolve() : import('../helpers/dom/requestVideoFrameCallbackPolyfill')
  ]).then(async([appDialogsManager]) => {
    let userId: string;
    if([SignInFlowType.firstUserSignIn, SignInFlowType.addUserSignIn].includes(options.type)) {
      userId = auth.user.id.toString();
    } else if(options.type === SignInFlowType.alreadySignedIn) {
      userId = (await SessionStorage.getInstance().get('current_user_id'));
      if(!userId) {
        userId = (await SessionStorage.getInstance().get('user_auth'))?.id.toString();
      }
    } else if(options.type === SignInFlowType.switchUserSignIn) {
      userId = options.userId.toString();
    }
    await SessionStorage.getInstance().set({'current_user_id': userId});

    if([
      SignInFlowType.alreadySignedIn,
      SignInFlowType.firstUserSignIn
    ].includes(options.type)) {
      // Migration to support multilogin flow.
      await Promise.all([
        StateStorage.assignStateToUserIfNeeded(userId),
        SessionStorage.assignStateToUserIfNeeded(userId)
      ]).catch(e => console.error(e));
    }

    if([
      SignInFlowType.addUserSignIn,
      SignInFlowType.firstUserSignIn
    ].includes(options.type)) {
      await SharedUsersStateStorage.getInstance().set({[userId]: auth.user});
      await rootScope.managers.apiManager.setUser(auth.user);
    }

    if(options.type === SignInFlowType.firstUserSignIn) {
      await rootScope.managers.appStoragesManager.loadStorages(userId);
    } else if([
      SignInFlowType.addUserSignIn,
      SignInFlowType.switchUserSignIn
    ].includes(options.type)) {
      const user = await SharedUsersStateStorage.getInstance().get(userId);
      SessionStorage.setUserInstance(userId);
      await rootScope.managers.apiManager.setUser(user);
      await rootScope.managers.apiManager.setUserAuth(userId);
      await SessionStorage.setUserStateAsCurrent(userId);
      window.location.reload();
      // await rootScope.managers.appStoragesManager.reloadStorages(userId);
      // const stateResult = await apiManagerProxy.sendState().then(([stateResult]) => stateResult);
      // I18n.setTimeFormat(stateResult.state.settings.timeFormat);
      // rootScope.managers.rootScope.getPremium().then((isPremium) => {
      //   rootScope.premium = isPremium;
      // });
    }

    page.unmount();

    await Promise.all([
      rootScope.managers.appUsersManager.init(),
      rootScope.managers.appChatsManager.init(),
      rootScope.managers.dialogsStorage.init(),
      rootScope.managers.appStickersManager.init()
    ]);

    appDialogsManager.default.start();
    setTimeout(() => {
      document.getElementById('auth-pages').style.display = 'none';
      document.getElementById('page-chats').style.display = 'block';
      import('./pageSignQR').then(module => module.default.unmount()),
      import('./pageSignIn').then(module => module.default.unmount()),
      import('./pageSignImport').then(module => module.default.unmount()),
      import('./pageAuthCode').then(module => module.default.unmount()),
      import('./pagePassword').then(module => module.default.unmount())
    }, 1e3);
  });
};

const page: Page = new Page('page-chats', false, () => {}, onFirstMount);
export default page;
