const MaxZIndex = 2147483647;
const DEFAULT_CSS = {
  display: 'none',
  position: 'absolute',
  zIndex: MaxZIndex.toString(),
};

class UIWidget {
  _root;
  _timeoutId;
  _lastCss = {};

  constructor({ root }) {
    if (!root) {
      throw new Error('Prop [root] is required');
    }
    this._root = root;
    this._init();
  }

  _init() {
    this._updateCss(DEFAULT_CSS);
    this._root.addEventListener('mouseenter', () => {
      clearTimeout(this._timeoutId);
    });
    this._root.addEventListener('mouseleave', () => {
      this.hide();
    });
  }

  _updateCss(newCss) {
    const mergedCss = {
      ...this._lastCss,
      ...newCss,
    };
    const hasChanged =
      JSON.stringify(mergedCss) !== JSON.stringify(this._lastCss);
    if (hasChanged) {
      this._lastCss = mergedCss;
      Object.keys(mergedCss).forEach((key) => {
        this._root.style[key] = this._lastCss[key];
      });
    }
  }

  show(rect) {
    clearTimeout(this._timeoutId);
    this._updateCss({
      display: 'block',
      top: Math.round(rect.top + window.pageYOffset) + 'px',
      left: Math.round(rect.right + window.pageXOffset + 5) + 'px',
    });
  }

  hide(timeout = 512) {
    if (timeout) {
      this._timeoutId = setTimeout(() => {
        this._updateCss({ display: 'none' });
      }, timeout);
    } else {
      this._updateCss({ display: 'none' });
    }
  }

  get root() {
    return this._root;
  }
}
