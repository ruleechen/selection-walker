import { IWidgetProps } from './interfaces';

class UIWidget {
  private _root: HTMLElement;
  private _timeoutId: number;

  constructor(private props: IWidgetProps) {
    if (!this.props.root) {
      throw new Error('Prop [root] is required');
    }
    this._root = this.props.root;
    this.init();
  }

  private init() {
    this._root.style.position = 'absolute';
    this._root.style.display = 'none';
    this._root.style.zIndex = '100000';
    this._root.addEventListener('mouseenter', () => {
      clearTimeout(this._timeoutId);
    });
    this._root.addEventListener('mouseleave', () => {
      this.hide();
    });
  }

  show(rect: ClientRect) {
    clearTimeout(this._timeoutId);
    this._root.style.display = 'block';
    this._root.style.top = rect.top + window.pageYOffset + 'px';
    this._root.style.left = rect.right + window.pageXOffset + 5 + 'px';
  }

  hide(timeout: number = 512) {
    if (timeout) {
      this._timeoutId = setTimeout(() => {
        this._root.style.display = 'none';
      }, timeout);
    } else {
      this._root.style.display = 'none';
    }
  }

  get root() {
    return this._root;
  }
}

export default UIWidget;
