import {ButtonIconTsx} from '../buttonIconTsx';

export interface MobileNavigationBarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onClose: () => void;
}

export function NavigationBar(props: MobileNavigationBarProps) {
  return (
    <div class="navigation-bar">
      <div class="navigation-bar-icons">
        <ButtonIconTsx
          icon="close"
          onClick={props.onClose}
        />
      </div>
      <div class="navigation-bar-icons">
        <ButtonIconTsx
          disabled={props.canUndo}
          icon="undo"
          asSvgIcon={true}
          onClick={props.onUndo}
        />
        <ButtonIconTsx
          disabled={props.canRedo}
          icon="redo"
          asSvgIcon={true}
          onClick={props.onRedo}
        />
        <ButtonIconTsx
          disabled={true}
          icon="unknow_icon_filler"
        />
        <ButtonIconTsx
          icon="check"
          onClick={props.onSave}
        />
      </div>
    </div>
  );
}
