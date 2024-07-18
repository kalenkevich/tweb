import {JSX, onMount} from 'solid-js';
import {render} from 'solid-js/web';

export interface ContentRenderProps {
  hide: () => void;
}

/**
 * Class to manage showing/hiding whole windows.
 */
export class WholeDialogManagerTsx {
  private static _instance: WholeDialogManagerTsx;
  static getInstance() {
    if(!this._instance) {
      this._instance = new WholeDialogManagerTsx();
    }

    return this._instance;
  }

  private rootEl: HTMLElement;
  private overlayEl?: HTMLDivElement;
  private contentEl?: HTMLDivElement;

  constructor(private readonly anchorEl: HTMLElement = document.body) {
    this.rootEl = document.createElement('div');
    this.rootEl.classList.add('whole-dialog-manager');
    this.anchorEl.appendChild(this.rootEl);
  }

  show(renderFn: (renderProps: ContentRenderProps) => JSX.Element) {
    render(() => {
      onMount(() => {
        this.overlayEl?.focus();
      });

      return (
        <div class="whole-dialog-manager__overlay"
          tabindex="0"
          ref={this.overlayEl}
        >
          <div class="whole-dialog-manager__content" ref={this.contentEl}>
            <div class="whole-dialog-manager__content-wrapper"
              onClick={(e) => e.stopImmediatePropagation()}>
              {renderFn({hide: () => this.hide()})}
            </div>
          </div>
        </div>
      );
    }, this.rootEl);
  }

  hide() {
    if(this.overlayEl) {
      this.overlayEl.remove();
    }
  }
}
