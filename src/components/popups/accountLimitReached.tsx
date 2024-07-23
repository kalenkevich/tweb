import {render} from 'solid-js/web';
import PopupElement from '.';
import {IconTsx} from '../iconTsx';
import {i18n} from '../../lib/langPack'

export interface AccountLimitReachedPopupContentProps {
  currentAccounts: number;
  onCloseClick?: () => void;
  onLimitIncreseClick: () => void;
 }

export function AccountLimitReachedPopupContent(props: AccountLimitReachedPopupContentProps) {
  return (
    <div class="account-limit-reached-popup">
      <div class="account-limit-reached-popup__diagram">
        <div class="diagram__limit-pin">
          <IconTsx class="limit-pin-background-icon" icon="limit-pin-background" asSvgIcon={true}/>
          <div class="limit-pin-foreground">
            <IconTsx class="limit-pin-person-icon" icon="person" asSvgIcon={true}/>
            {props.currentAccounts}
          </div>
        </div>
        <div class="diagram__wrapper">
          <div class="diagram__left-size">
            {i18n('AddAccountFlow.Free')}
          </div>
          <div class="diagram__right-size">
            <div>
              {i18n('AddAccountFlow.Premium')}
            </div>
            <div>
              {props.currentAccounts + 1}
            </div>
          </div>
        </div>
      </div>
      <div class="account-limit-reached-popup__description">
        {i18n('AddAccountFlow.LimitReachDescription')} <b>Telegram Premium.</b>
      </div>
    </div>
  );
}

export class AccountLimitReachedPopup extends PopupElement {
  constructor(props: AccountLimitReachedPopupContentProps) {
    super('account-limit-reached-popup-container', {
      overlayClosable: true,
      title: i18n('AddAccountFlow.LimitReached'),
      body: true,
      scrollable: true,
      buttons: [{
        text: (
          <div class="increase-limit-button">
            {i18n('AddAccountFlow.IncreaseLimit')}
            <div class="increase-limit-button__icon">+1</div>
          </div>
        ),
        callback: props.onLimitIncreseClick
      }, {
        langKey: 'Cancel',
        isCancel: true,
        callback: props.onCloseClick
      }]
    });

    this.construct(props);
  }

  construct(props: AccountLimitReachedPopupContentProps) {
    const anchorEl = document.createElement('div');
    this.scrollable.append(anchorEl);

    const onCloseClick = () => {
      this.hide();
      props.onCloseClick?.();
    };

    const dispose = render(() => (
      <AccountLimitReachedPopupContent
        currentAccounts={props.currentAccounts}
        onCloseClick={onCloseClick}
        onLimitIncreseClick={props.onLimitIncreseClick}
      />
    ), anchorEl);

    this.addEventListener('closeAfterTimeout', dispose);
    this.show();
  }
}
