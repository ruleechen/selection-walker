export const nextId = (function() {
  let incrementingId = 0;
  return function(): string {
    return (incrementingId++).toString();
  };
})();

export const RcIdAttrName = 'rcid';

export function getRcId(el: Element, createNew: boolean): string {
  let rcId = el.getAttribute(RcIdAttrName);
  if (!rcId && createNew === true) {
    rcId = nextId();
    el.setAttribute(RcIdAttrName, rcId);
  }
  return rcId;
}

export function getEventElement(node: Node): Element {
  const element =
    node instanceof Element ? (node as Element) : (node.parentNode as Element);
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
  while (node) {
    if (node === document.body) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
}
