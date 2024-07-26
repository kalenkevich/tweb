import {AuthAuthorization} from '../layer';
import Page from './page';

export enum SignInFlowType {
  alreadySignedIn = 'alreadySignedIn',
  firstUserSignIn = 'firstUserSignIn',
  addUserSignIn = 'addUserSignIn',
  switchUserSignIn = 'switchUserSignIn'
}

export type SignInFlowOptions = AddUserSignInFlowOptions
  | SwitchUserSignInFlowOptions
  | AlreadySignedInFlowOptions
  | FirstUserSignInFlowOptions;

export interface AddUserSignInFlowOptions {
  type: SignInFlowType.addUserSignIn;
  onClose?: (page: Page) => void;
  onSucessLoginCallback?: (authorization: AuthAuthorization.authAuthorization) => void;
}

export interface SwitchUserSignInFlowOptions {
  type: SignInFlowType.switchUserSignIn;
  userId: string;
}

export interface AlreadySignedInFlowOptions {
  type: SignInFlowType.alreadySignedIn;
}

export interface FirstUserSignInFlowOptions {
  type: SignInFlowType.firstUserSignIn;
}
