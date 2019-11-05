import { IMatch, IWalkerParams } from './interfaces';
import DataManager from './DataManager';

class Walker {
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

  private _observer: MutationObserver;
  private _matchesMgr: DataManager = new DataManager();
  private _mouseenterHandler: EventListener;
  private _mouseleaveHandler: EventListener;
  private _mousemoveHandler: EventListener;
  private _lastMatch: IMatch;

  constructor(private props: IWalkerParams) {
    const me = this;
    this._mouseenterHandler = function() {
      const node = this as Element;
      me.buildRect(node);
    };
    this._mouseleaveHandler = function() {
      const node = this as Element;
      me.hideMatched(node);
    };
    this._mousemoveHandler = function(ev: MouseEvent) {
      const node = this as Element;
      me.matchRect(node, ev);
    };
  }

  start() {
    this.observe(this.props.container);
    this.initMatches(this.props.container);
  }

  private initMatches(node: Node) {
    const matches = this.props.matcher(node);
    matches.forEach(match => {
      const node = this.getEventNode(match);
      // cache matches
      const matches = this._matchesMgr.get<IMatch[]>(node, []);
      matches.push(match);
      this._matchesMgr.set(node, matches);
      // attach events
      this.removeEvents(node);
      node.addEventListener('mouseenter', this._mouseenterHandler);
      node.addEventListener('mouseleave', this._mouseleaveHandler);
      node.addEventListener('mousemove', this._mousemoveHandler);
    });
  }

  private getEventNode(match: IMatch) {
    const node =
      match.startsNode.nodeType === 3
        ? (match.startsNode.parentNode as Element)
        : (match.startsNode as Element);
    return node;
  }

  private removeEvents(node: Element) {
    node.removeEventListener('mouseenter', this._mouseenterHandler);
    node.removeEventListener('mouseleave', this._mouseleaveHandler);
    node.removeEventListener('mousemove', this._mousemoveHandler);
  }

  private buildRect(node: Element) {
    const matches = this._matchesMgr.get<IMatch[]>(node);
    if (matches) {
      matches.forEach(match => {
        const range = Walker.createRange(match);
        match.rect = range.getBoundingClientRect();
      });
    }
  }

  private matchRect(node: Element, ev: MouseEvent) {
    const matches = this._matchesMgr.get<IMatch[]>(node);
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
        if (!this._lastMatch || this._lastMatch !== match) {
          this._lastMatch = match;
          this.props.hover(match);
        }
      } else {
        this._lastMatch = null;
        this.props.hover(null);
      }
    }
  }

  private hideMatched(node: Element) {
    if (this._lastMatch) {
      this._lastMatch = null;
      this.props.hover(null);
    }
  }

  private observe(node: Node) {
    this._observer = new MutationObserver((mutationsList, observer) => {
      mutationsList.forEach(mutations => {
        // mutations.addedNodes
        // ...
      });
    });
    this._observer.observe(node, {
      attributes: false,
      childList: true,
      subtree: false
    });
  }

  destroy() {
    this._observer.disconnect();
    this._matchesMgr.keys().forEach(key => {
      const matches = this._matchesMgr.get<IMatch[]>(key);
      if (matches) {
        matches.forEach(match => {
          const node = this.getEventNode(match);
          this.removeEvents(node);
        });
      }
    });
  }
}

export default { Walker };
