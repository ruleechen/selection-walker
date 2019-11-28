export const RcIdAttrName = 'rcid';
export const LinkedRcIdPropName = `l${RcIdAttrName}`;
export const valueNodeTypes = ['INPUT', 'SELECT', 'TEXTAREA'];

export const nextId = (function() {
  let incrementingId = 0;
  return function(): string {
    return (incrementingId++).toString();
  };
})();

export function getRcId(node: Element, createNew: boolean): string {
  if (!node) {
    throw new Error('[node] is required');
  }
  let rcId = node.getAttribute(RcIdAttrName);
  if (!rcId && createNew === true) {
    rcId = `r${nextId()}`;
    node.setAttribute(RcIdAttrName, rcId);
  }
  return rcId;
}

export function getEventElement(node: Node): Element {
  if (!node) {
    throw new Error('[node] is required');
  }
  const element =
    node instanceof Element ? (node as Element) : node.parentElement;
  return element;
}

export function isNodeInDom(node: Node): boolean {
  if (!node) {
    return false;
  }
  const element = getEventElement(node);
  if (element) {
    const rect = element.getBoundingClientRect();
    if (rect.top || rect.left || rect.height || rect.width) {
      return true;
    }
  }
  let current = node;
  while (current) {
    if (current === document.body) {
      return true;
    }
    current = current.parentNode;
  }
  return false;
}

export function isValueNode(node: Element): boolean {
  return valueNodeTypes.indexOf(node.tagName) !== -1;
}

export function queryValueNodes(node: Element): Element[] {
  let nodes = [];
  if (isValueNode(node)) {
    nodes.push(node);
  } else {
    for (const tag of valueNodeTypes) {
      nodes = nodes.concat(Array.from(node.querySelectorAll(tag)));
    }
  }
  return nodes;
}

export function upFirstValueNode(node: Node, levels: number = 3): Element {
  let search = 0;
  let current = node;
  while (current && search < levels) {
    if (current.nodeType === 1) {
      const element = current as Element;
      if (isValueNode(element)) {
        return element;
      }
    }
    search = search + 1;
    current = current.parentNode;
  }
  return null;
}

interface throttleFunc {
  (...args: any[]): any;
}

export interface Throttler {
  valid: (...args: any[]) => boolean;
}

export class DelayThrottler implements Throttler {
  private _last: number = 0;
  private _delay: number;
  constructor(delay: number) {
    this._delay = delay;
  }
  valid(): boolean {
    const now = Date.now();
    if (now - this._last > this._delay) {
      this._last = now;
      return true;
    }
    return false;
  }
}

export function throttled(
  throttler: Throttler,
  func: throttleFunc
): throttleFunc {
  if (!throttler) {
    throw new Error('[throttler] is required');
  }
  if (!func) {
    throw new Error('[func] is required');
  }
  return function(...args) {
    if (throttler.valid(...args)) {
      return func(...args);
    }
  };
}
