import { IMatch } from './interfaces';
import { getEventElement, getRcId, LinkedRcIdPropName } from './utilities';

class MatchObject implements IMatch {
  private _rect: ClientRect;
  private _target: Element;

  constructor(private props: IMatch) {
    if (!this.props.startsNode) {
      throw new Error('[startsNode] is required');
    }
    if (!this.props.endsNode) {
      throw new Error('[endsNode] is required');
    }
    // setup link
    const target = this.getEventTarget();
    const rcId = getRcId(target, true);
    this.startsNode[LinkedRcIdPropName] = rcId;
    this.endsNode[LinkedRcIdPropName] = rcId;
  }

  createRange(): Range {
    const range = document.createRange();
    if (this.startsNode instanceof Element) {
      range.setStartBefore(this.startsNode);
    } else {
      range.setStart(this.startsNode, this.startsAt);
    }
    if (this.endsNode instanceof Element) {
      range.setEndAfter(this.endsNode);
    } else {
      range.setEnd(this.endsNode, this.endsAt);
    }
    return range;
  }

  getEventTarget(): Element {
    // should cache event target reference
    // we can't get the correct event target when the startsNode or the endsNode is removed
    if (!this._target) {
      let node: Node;
      if (this.startsNode === this.endsNode) {
        node = this.startsNode;
      } else {
        const range = this.createRange();
        node = range.commonAncestorContainer;
        range.detach(); // Releases the Range from use to improve performance.
      }
      this._target = getEventElement(node);
    }
    return this._target;
  }

  buildRect() {
    const range = this.createRange();
    this._rect = range.getBoundingClientRect();
    range.detach(); // Releases the Range from use to improve performance.
  }

  isMatch(x: number, y: number): boolean {
    return (
      this.rect &&
      this.rect.left <= x &&
      x <= this.rect.right &&
      this.rect.top <= y &&
      y <= this.rect.bottom
    );
  }

  contains(node: Node): boolean {
    return this.startsNode === node || this.endsNode === node;
  }

  get startsNode(): Node {
    return this.props.startsNode;
  }

  get startsAt(): number {
    return this.props.startsAt;
  }

  get endsNode(): Node {
    return this.props.endsNode;
  }

  get endsAt(): number {
    return this.props.endsAt;
  }

  get rect(): ClientRect {
    return this._rect;
  }

  get context(): any {
    return this.props.context;
  }
}

export default MatchObject;
