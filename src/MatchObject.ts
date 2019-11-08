import { getEventElement } from './utilities';
import { IMatch } from './interfaces';

class MatchObject implements IMatch {
  private _rect: ClientRect;

  constructor(private props: IMatch) {
    if (!this.props.startsNode) {
      throw new Error('[startsNode] is required');
    }
    if (!this.props.endsNode) {
      throw new Error('[endsNode] is required');
    }
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
    let node: Node;
    if (this.startsNode === this.endsNode) {
      node = this.startsNode;
    } else {
      const range = this.createRange();
      node = range.commonAncestorContainer;
      range.detach(); // Releases the Range from use to improve performance.
    }
    return getEventElement(node);
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

  set rect(value: ClientRect) {
    this._rect = value;
  }

  get context(): any {
    return this.props.context;
  }
}

export default MatchObject;
