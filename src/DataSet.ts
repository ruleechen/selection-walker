import { getRcId } from './utilities';

class DataSet {
  static formalizeKey(key: string | Element, createNew: boolean) {
    const theKey = key instanceof Element ? getRcId(key, createNew) : key;
    return theKey;
  }

  private _store: { [key: string]: any } = {};

  get<T>(key: string | Element, defVal: T = null): T {
    const theKey = DataSet.formalizeKey(key, false);
    return theKey in this._store ? this._store[theKey] : defVal;
  }

  set<T>(key: string | Element, value: T): any {
    const theKey = DataSet.formalizeKey(key, true);
    this._store[theKey] = value;
  }

  remove(key: string | Element) {
    const theKey = DataSet.formalizeKey(key, false);
    return delete this._store[theKey];
  }

  keys() {
    return Object.keys(this._store);
  }

  clear() {
    this._store = {};
  }
}

export default DataSet;
