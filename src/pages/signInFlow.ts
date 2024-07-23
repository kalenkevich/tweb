import {AuthAuthorization} from '../layer';

export enum SignInFlowType {
  firstAccountSignIn = 'firstAccountSignIn',
  addAccountSignIn = 'addAccountSignIn',
}

export interface SignInFlowOptions {
  type: SignInFlowType;
  onSucessLoginCallback?: (authorization: AuthAuthorization.authAuthorization) => void;
}
