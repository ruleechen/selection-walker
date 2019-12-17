export const valueNodeTypes = ['INPUT', 'SELECT', 'TEXTAREA'];

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
  return node && valueNodeTypes.indexOf(node.tagName) !== -1;
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

export function isTextNode(node: Node): boolean {
  return node && node.nodeType === 3;
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
    search += 1;
    current = current.parentNode;
  }
  return null;
}
