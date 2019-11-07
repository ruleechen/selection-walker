import { IMatch, IWalkerProps } from './interfaces';
import { getEventElement, RcIdAttrName } from './utilities';
import DataSet from './DataSet';

class MatchWalker {
  static createRange(match: IMatch): Range {
    const range = document.createRange();
    if (match.startsNode instanceof Element) {
      range.setStartBefore(match.startsNode);
    } else {
      range.setStart(match.startsNode, match.startsAt);
    }
    if (match.endsNode instanceof Element) {
      range.setEndAfter(match.endsNode);
    } else {
      range.setEnd(match.endsNode, match.endsAt);
    }
    return range;
  }

  static getEventTarget(match: IMatch): Element {
    let node: Node;
    if (match.startsNode === match.endsNode) {
      node = match.startsNode;
    } else {
      const range = MatchWalker.createRange(match);
      node = range.commonAncestorContainer;
      range.detach(); // Releases the Range from use to improve performance.
    }
    return getEventElement(node);
  }

  private _observer: MutationObserver;
  private _matchesSet: DataSet = new DataSet();
  private _mouseenterHandler: EventListener;
  private _mouseleaveHandler: EventListener;
  private _mousemoveHandler: EventListener;
  private _lastMatch: IMatch;

  constructor(private props: IWalkerProps) {
    if (!this.props.root) {
      throw new Error('Prop [container] is required');
    }
    if (!this.props.matcher) {
      throw new Error('Prop [matcher] is required');
    }
    if (!this.props.hover) {
      throw new Error('Prop [hover] is required');
    }
    // event handlers
    const me = this;
    this._mouseenterHandler = function(ev: MouseEvent) {
      ev.cancelBubble = true;
      const node = this as Element;
      me.buildRect(node);
    };
    this._mouseleaveHandler = function(ev: MouseEvent) {
      ev.cancelBubble = true;
      me.hideMatched();
    };
    this._mousemoveHandler = function(ev: MouseEvent) {
      ev.cancelBubble = true;
      const node = this as Element;
      me.matchRect(node, ev);
    };
  }

  start() {
    this.observe(this.props.root);
    this.searchMatches(this.props.root);
  }

  searchMatches(node: Node) {
    const matches = this.props.matcher(node);
    matches.forEach(match => {
      const node = MatchWalker.getEventTarget(match);
      // cache matches
      const matches = this._matchesSet.get<IMatch[]>(node, []);
      matches.push(match);
      this._matchesSet.set(node, matches);
      // attach events
      this.removeEvents(node);
      this.addEvents(node);
    });
  }

  stripMatches(node: Node) {
    const element = getEventElement(node);
    const elements = Array.from(element.querySelectorAll(`[${RcIdAttrName}]`));
    if (element.getAttribute(RcIdAttrName)) {
      elements.push(element);
    }
    elements.forEach(el => {
      this.removeEvents(el);
      this._matchesSet.remove(el);
      el.removeAttribute(RcIdAttrName);
    });
  }

  // https://api.jquery.com/mouseenter/
  private addEvents(node: Element) {
    node.addEventListener('mouseenter', this._mouseenterHandler);
    node.addEventListener('mouseleave', this._mouseleaveHandler);
    node.addEventListener('mousemove', this._mousemoveHandler);
  }

  private removeEvents(node: Element) {
    node.removeEventListener('mouseenter', this._mouseenterHandler);
    node.removeEventListener('mouseleave', this._mouseleaveHandler);
    node.removeEventListener('mousemove', this._mousemoveHandler);
  }

  private buildRect(node: Element) {
    const matches = this._matchesSet.get<IMatch[]>(node);
    if (matches) {
      matches.forEach(match => {
        const range = MatchWalker.createRange(match);
        match.rect = range.getBoundingClientRect();
        range.detach(); // Releases the Range from use to improve performance.
      });
    }
  }

  private matchRect(node: Element, ev: MouseEvent) {
    const matches = this._matchesSet.get<IMatch[]>(node);
    if (matches) {
      const match = matches.find(m => {
        return (
          m.rect.left <= ev.x &&
          ev.x <= m.rect.right &&
          m.rect.top <= ev.y &&
          ev.y <= m.rect.bottom
        );
      });
      if (match) {
        this.showMatched(match);
      } else {
        this.hideMatched();
      }
    }
  }

  private showMatched(match: IMatch) {
    if (!this._lastMatch || this._lastMatch !== match) {
      this._lastMatch = match;
      this.props.hover(match);
    }
  }

  private hideMatched() {
    if (this._lastMatch) {
      this._lastMatch = null;
      this.props.hover(null);
    }
  }

  private observe(node: Node) {
    this._observer = new MutationObserver(mutationsList => {
      mutationsList.forEach(mutations => {
        switch (mutations.type) {
          case 'characterData':
            const element = getEventElement(mutations.target);
            this.searchMatches(element);
            break;

          case 'attributes':
            this.searchMatches(mutations.target);
            break;

          case 'childList':
            mutations.addedNodes.forEach(node => {
              this.searchMatches(node);
            });
            mutations.removedNodes.forEach(node => {
              this.stripMatches(node);
            });
            break;

          default:
            break;
        }
      });
    });
    this._observer.observe(node, {
      attributes: false, // close this since it's so heavy
      characterData: true,
      childList: true,
      subtree: true
    });
  }

  destroy() {
    this._observer.disconnect();
    this.stripMatches(this.props.root);
    this._matchesSet.clear();
  }
}

export default MatchWalker;
