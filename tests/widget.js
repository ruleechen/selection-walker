const MaxZIndex = 2147483647;

class UIWidget {
  _root;
  _timeoutId;
  _lastTop;
  _lastLeft;

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
    const top = Math.round(rect.top + window.pageYOffset);
    const left = Math.round(rect.right + window.pageXOffset + 5);
    if (this._lastTop !== top || this._lastLeft !== left) {
      this._lastTop = top;
      this._lastLeft = left;
      this._root.style.display = 'block';
      this._root.style.top = top + 'px';
      this._root.style.left = left + 'px';
    }
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
