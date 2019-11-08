export const nextId = (function() {
  let incrementingId = 0;
  return function(): string {
    return (incrementingId++).toString();
  };
})();

export const RcIdAttrName = 'rcid';
export const LinkedRcIdPropName = `l${RcIdAttrName}`;

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

export function isValueNode(node: Node): boolean {
  if (!node) {
    return false;
  }
  return (
    node instanceof HTMLInputElement ||
    node instanceof HTMLSelectElement ||
    node instanceof HTMLTextAreaElement
  );
}

export function queryValueNodes(node: Element): Element[] {
  let nodes = [];
  if (isValueNode(node)) {
    nodes.push(node);
  } else {
    for (const tag of ['input', 'textarea', 'select']) {
      nodes = nodes.concat(Array.from(node.querySelectorAll(tag)));
    }
  }
  return nodes;
}
