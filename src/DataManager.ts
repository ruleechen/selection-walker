const AttrName = 'rcid';

class DataManager {
  private _store: { [key: string]: any } = {};
  private static incrementingId: number = 0;

  private getRcId(el: Element, createNew: boolean): string {
    let rcid = el.getAttribute(AttrName);
    if (!rcid && createNew === true) {
      rcid = (DataManager.incrementingId++).toString();
      el.setAttribute(AttrName, rcid);
    }
    return rcid;
  }

  get<T>(key: string | Element, defVal: T = null): T {
    const theKey = key instanceof Element ? this.getRcId(key, false) : key;
    return theKey in this._store ? this._store[theKey] : defVal;
  }

  set<T>(key: string | Element, value: T): any {
    const theKey = key instanceof Element ? this.getRcId(key, true) : key;
    this._store[theKey] = value;
  }

  keys() {
    return Object.keys(this._store);
  }

  clear() {
    this._store = {};
  }
}

export { AttrName };
export default DataManager;
