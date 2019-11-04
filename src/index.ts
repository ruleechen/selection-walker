import { IMatch, IWalkerParams } from './interfaces';
import DataManager from './DataManager';

class Walker {
  _matchesMgr: DataManager = new DataManager();
  _mouseenterHandler;
  _mouseleaveHandler;
  _mousemoveHandler;
  _lastMatch: IMatch;

  constructor(private props: IWalkerParams) {
    const me = this;
    this._mouseenterHandler = function() {
      const node = this as Element;
      me._buildRect(node);
    };
    this._mouseleaveHandler = function() {
      const node = this as Element;
      me._hideMatched(node);
    };
    this._mousemoveHandler = function(ev: MouseEvent) {
      const node = this as Element;
      me._matchRect(node, ev);
    };
  }

  start() {
    this._observe(this.props.container);
    this._initMatches(this.props.container);
  }

  _initMatches(node: Node) {
    const items = this.props.matcher(node);
    items.forEach(item => {
      const node =
        item.startsNode.nodeType === 3
          ? (item.startsNode.parentNode as Element)
          : (item.startsNode as Element);
      // cache matches
      const matches = this._matchesMgr.get<IMatch[]>(node, []);
      matches.push(item);
      this._matchesMgr.set(node, matches);
      // attach events
      node.removeEventListener('mouseenter', this._mouseenterHandler);
      node.removeEventListener('mouseleave', this._mouseleaveHandler);
      node.removeEventListener('mousemove', this._mousemoveHandler);
      node.addEventListener('mouseenter', this._mouseenterHandler);
      node.addEventListener('mouseleave', this._mouseleaveHandler);
      node.addEventListener('mousemove', this._mousemoveHandler);
    });
  }

  static createRange(match: IMatch): Range {
    const range = document.createRange();
    if (match.startsNode.tagName === 'INPUT') {
      range.setStartBefore(match.startsNode);
      range.setEndAfter(match.endsNode);
    } else {
      range.setStart(match.startsNode, match.startsAt);
      range.setEnd(match.endsNode, match.endsAt);
    }
    return range;
  }

  _buildRect(node: Element) {
    const matches = this._matchesMgr.get<IMatch[]>(node);
    if (matches) {
      matches.forEach(match => {
        const range = Walker.createRange(match);
        match.rect = range.getBoundingClientRect();
      });
    }
  }

  _matchRect(node: Element, ev: MouseEvent) {
    const matches = this._matchesMgr.get<IMatch[]>(node);
    if (matches) {
      for (const match of matches) {
        if (
          match.rect.left <= ev.x &&
          ev.x <= match.rect.right &&
          match.rect.top <= ev.y &&
          ev.y <= match.rect.bottom
        ) {
          if (!this._lastMatch || this._lastMatch !== match) {
            this._lastMatch = match;
            this.props.hover(match);
            break;
          }
        } else {
          this._lastMatch = null;
          this.props.hover(null);
        }
      }
    }
  }

  _hideMatched(node: Element) {
    if (this._lastMatch) {
      this._lastMatch = null;
      this.props.hover(null);
    }
  }

  _observe(node: Node) {
    const observer = new MutationObserver((mutationsList, observer) => {
      mutationsList.forEach(mutations => {
        // mutations.addedNodes
        // ...
      });
    });
    observer.observe(node, {
      attributes: false,
      childList: true,
      subtree: false
    });
  }

  destroy() {}
}

export default { Walker };
