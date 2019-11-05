import { IMatch, IWalkerProps } from './interfaces';
import { getEventNode } from './utilities';
import DataManager from './DataManager';

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

  private _observer: MutationObserver;
  private _matchesMgr: DataManager = new DataManager();
  private _mouseenterHandler: EventListener;
  private _mouseleaveHandler: EventListener;
  private _mousemoveHandler: EventListener;
  private _lastMatch: IMatch;

  constructor(private props: IWalkerProps) {
    const me = this;
    this._mouseenterHandler = function() {
      const node = this as Element;
      me.buildRect(node);
    };
    this._mouseleaveHandler = function() {
      me.hideMatched();
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
      const node = getEventNode(match.startsNode);
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

  // https://api.jquery.com/mouseenter/
  private removeEvents(node: Element) {
    node.removeEventListener('mouseenter', this._mouseenterHandler);
    node.removeEventListener('mouseleave', this._mouseleaveHandler);
    node.removeEventListener('mousemove', this._mousemoveHandler);
  }

  private buildRect(node: Element) {
    const matches = this._matchesMgr.get<IMatch[]>(node);
    if (matches) {
      matches.forEach(match => {
        const range = MatchWalker.createRange(match);
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
    this._observer = new MutationObserver((mutationsList, observer) => {
      mutationsList.forEach(mutations => {
        // mutations.addedNodes
        // ...
      });
    });
    this._observer.observe(node, {
      attributes: false,
      characterData: true,
      childList: true,
      subtree: true
    });
  }

  destroy() {
    this._observer.disconnect();
    this._matchesMgr.keys().forEach(key => {
      const matches = this._matchesMgr.get<IMatch[]>(key);
      if (matches && matches.length) {
        const node = getEventNode(matches[0].startsNode);
        this.removeEvents(node);
      }
    });
    this._matchesMgr.clear();
  }
}

export default MatchWalker;
