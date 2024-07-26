import Page from './page';
import {SignInFlowType, SignInFlowOptions} from './signInFlow';
import ButtonIcon from '../components/buttonIcon';
import {attachClickEvent} from '../helpers/dom/clickEvent';
import IS_TOUCH_SUPPORTED from '../environment/touchSupport';
import {IS_MOBILE_SAFARI} from '../environment/userAgent';

export function setupCloseButton(page: Page, signInFlowOptions: SignInFlowOptions) {
  const closeButton = document.querySelector('.auth-page__close-button') as HTMLDivElement;

  if(!closeButton) {
    return;
  }

  if(closeButton.children.length) {
    closeButton.children[0].remove();
  }

  if(signInFlowOptions.type !== SignInFlowType.addUserSignIn || !signInFlowOptions.onClose) {
    closeButton.style.display = 'none';
  } else {
    closeButton.style.display = 'block';
    const iconButon = ButtonIcon('close');
    attachClickEvent(iconButon, () => signInFlowOptions.onClose(page));
    closeButton.append(iconButon);
  }
}

export function setupSignInFlow() {
  const el = document.getElementById('auth-pages');
  el.style.display = 'block';
  document.getElementById('page-chats').style.display = 'none';
  let scrollable: HTMLElement;

  if(el) {
    scrollable = el.querySelector('.scrollable') as HTMLElement;
    if((!IS_TOUCH_SUPPORTED || IS_MOBILE_SAFARI)) {
      scrollable.classList.add('no-scrollbar');
    }

    if(scrollable.firstElementChild.classList.contains('auth-placeholder')) {
      return;
    }

    const placeholder = document.createElement('div');
    placeholder.classList.add('auth-placeholder');

    scrollable.prepend(placeholder);
    scrollable.append(placeholder.cloneNode());
  }
}
