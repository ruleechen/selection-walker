class SelectionPoint {
  _el: Node;
  _offset: number;

  constructor({ el, offset }) {
    this._el = el;
    this._offset = offset;
  }

  el(): Node {
    return this._el;
  }

  offset(): number {
    return this._offset;
  }
}

export default SelectionPoint;
