export function getEventNode(node: Node): Element {
  const element =
    node instanceof Element ? (node as Element) : (node.parentNode as Element);
  return element;
}

export function isInDom(node: Node) {
  if (!node) {
    return false;
  }
  const element = getEventNode(node);
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
