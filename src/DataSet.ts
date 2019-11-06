import { getRcId } from './utilities';

class DataSet {
  private _store: { [key: string]: any } = {};

  get<T>(key: string | Element, defVal: T = null): T {
    const theKey = key instanceof Element ? getRcId(key, false) : key;
    return theKey in this._store ? this._store[theKey] : defVal;
  }

  set<T>(key: string | Element, value: T): any {
    const theKey = key instanceof Element ? getRcId(key, true) : key;
    this._store[theKey] = value;
  }

  keys() {
    return Object.keys(this._store);
  }

  clear() {
    this._store = {};
  }
}

export default DataSet;
