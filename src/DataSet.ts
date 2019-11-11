import { getRcId } from './utilities';

class DataSet<T> {
  static formalizeKey(key: string | Element, createNew: boolean): string {
    const theKey = key instanceof Element ? getRcId(key, createNew) : key;
    return theKey;
  }

  private _store: { [key: string]: T } = {};

  get(key: string | Element, defVal: T = null): T {
    const theKey = DataSet.formalizeKey(key, false);
    return theKey in this._store ? this._store[theKey] : defVal;
  }

  set(key: string | Element, value: T) {
    const theKey = DataSet.formalizeKey(key, true);
    this._store[theKey] = value;
  }

  remove(key: string | Element): boolean {
    const theKey = DataSet.formalizeKey(key, false);
    return delete this._store[theKey];
  }

  keys(): string[] {
    return Object.keys(this._store);
  }

  clear() {
    this._store = {};
  }
}

export default DataSet;
