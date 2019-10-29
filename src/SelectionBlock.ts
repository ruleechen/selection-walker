import SelectionPoint from './SelectionPoint';

class SelectionBlock {
  _key: string;
  _start: SelectionPoint;
  _end: SelectionPoint;

  constructor({ key, start, end }) {
    this._key = key;
    this._start = start;
    this._end = end;
  }

  key(): string {
    return this._key;
  }

  toRange(): Range {
    const range = document.createRange();
    range.setStart(this._start.el(), this._start.offset());
    range.setEnd(this._end.el(), this._end.offset());
    return range;
  }
}

export default SelectionBlock;
