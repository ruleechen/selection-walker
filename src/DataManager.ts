const AttrName = 'rcid';

class DataManager {
  _store: { [key: string]: any } = {};
  static incrementingId: number = 0;

  getId(el: Element, createNew: boolean): string {
    let rcid = el.getAttribute(AttrName);
    if (!rcid && createNew === true) {
      rcid = (DataManager.incrementingId++).toString();
      el.setAttribute(AttrName, rcid);
    }
    return rcid;
  }

  get<T>(el: Element, defVal: T = null): T {
    const id = this.getId(el, false);
    return id ? this._store[id] : defVal;
  }

  set<T>(el: Element, value: T): any {
    const id = this.getId(el, true);
    this._store[id] = value;
  }
}

export { AttrName };
export default DataManager;
