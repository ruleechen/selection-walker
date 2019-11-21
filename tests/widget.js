const MaxZIndex = 2147483647;

class UIWidget {
  _root;
  _timeoutId;

  constructor({ root }) {
    if (!root) {
      throw new Error('Prop [root] is required');
    }
    this._root = root;
    this._init();
  }

  _init() {
    this._root.style.display = 'none';
    this._root.style.position = 'absolute';
    this._root.style.zIndex = MaxZIndex.toString();
    this._root.addEventListener('mouseenter', () => {
      clearTimeout(this._timeoutId);
    });
    this._root.addEventListener('mouseleave', () => {
      this.hide();
    });
  }

  show(rect) {
    clearTimeout(this._timeoutId);
    this._root.style.display = 'block';
    this._root.style.top = rect.top + window.pageYOffset + 'px';
    this._root.style.left = rect.right + window.pageXOffset + 5 + 'px';
  }

  hide(timeout = 512) {
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
