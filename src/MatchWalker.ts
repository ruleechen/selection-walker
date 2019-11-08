import { IMatch, IWalkerProps } from './interfaces';
import { getEventElement, queryValueNodes, RcIdAttrName } from './utilities';
import MatchObject from './MatchObject';
import DataSet from './DataSet';

const ParentRcIdPropName = `p${RcIdAttrName}`;

class MatchWalker {
  private _observer: MutationObserver;
  private _matchesSet: DataSet = new DataSet();
  private _mouseenterHandler: EventListener;
  private _mouseleaveHandler: EventListener;
  private _mousemoveHandler: EventListener;
  private _changeHandler: EventListener;
  private _lastHovered: MatchObject;

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
      me.hideHovered();
    };
    this._mousemoveHandler = function(ev: MouseEvent) {
      ev.cancelBubble = true;
      const node = this as Element;
      me.matchRect(node, ev);
    };
    this._changeHandler = function() {
      const node = this as Element;
      me.observeValueNode(node);
    };
  }

  start() {
    this.observe(this.props.root);
    this.bindValueNodes(this.props.root);
    this.searchMatches(this.props.root);
  }

  searchMatches(node: Node) {
    if (!node) {
      throw new Error('[node] is required');
    }
    const matched = this.props.matcher(node);
    matched.forEach(match => {
      this.addMatch(match);
    });
  }

  addMatch(imatch: IMatch) {
    if (!imatch) {
      throw new Error('[imatch] is required');
    }
    const match = new MatchObject(imatch);
    const node = match.getEventTarget();
    // cache matches
    const matches = this._matchesSet.get<MatchObject[]>(node, []);
    matches.push(match); //TODO: duplicate risk
    this._matchesSet.set(node, matches);
    // setup link
    const rcId = node.getAttribute(RcIdAttrName);
    match.startsNode[ParentRcIdPropName] = rcId;
    match.endsNode[ParentRcIdPropName] = rcId;
    // attach events
    this.removeNodeEvents(node);
    this.addNodeEvents(node);
  }

  stripMatches(node: Node) {
    if (!node) {
      throw new Error('[node] is required');
    }
    if (node instanceof Element) {
      const element = getEventElement(node);
      const elements = Array.from(
        element.querySelectorAll(`[${RcIdAttrName}]`)
      );
      if (element.getAttribute(RcIdAttrName)) {
        elements.push(element);
      }
      elements.forEach(el => {
        this.clearNodeMatches(el);
      });
    } else {
      const parentRcId = node[ParentRcIdPropName];
      if (parentRcId) {
        const parentNode = document.querySelector(
          `[${RcIdAttrName}="${parentRcId}"]`
        );
        if (parentNode) {
          let matches = this._matchesSet.get<MatchObject[]>(parentNode);
          if (matches) {
            matches = matches.filter(m => {
              return m.startsNode !== node && m.endsNode !== node;
            });
            if (matches.length) {
              this._matchesSet.set(parentNode, matches);
            } else {
              this.clearNodeMatches(parentNode);
            }
          }
        }
      }
    }
  }

  // https://api.jquery.com/mouseenter/
  private addNodeEvents(node: Element) {
    node.addEventListener('mouseenter', this._mouseenterHandler);
    node.addEventListener('mouseleave', this._mouseleaveHandler);
    node.addEventListener('mousemove', this._mousemoveHandler);
  }

  private removeNodeEvents(node: Element) {
    node.removeEventListener('mouseenter', this._mouseenterHandler);
    node.removeEventListener('mouseleave', this._mouseleaveHandler);
    node.removeEventListener('mousemove', this._mousemoveHandler);
  }

  private bindValueNodes(node: Node) {
    if (node instanceof Element) {
      const valueNodes = queryValueNodes(node);
      valueNodes.forEach(node => {
        node.addEventListener('change', this._changeHandler);
      });
    }
  }

  private unbindValueNodes(node: Node) {
    if (node instanceof Element) {
      const valueNodes = queryValueNodes(node);
      valueNodes.forEach(node => {
        node.removeEventListener('change', this._changeHandler);
      });
    }
  }

  private clearNodeMatches(node: Element) {
    this.removeNodeEvents(node);
    this._matchesSet.remove(node);
    node.removeAttribute(RcIdAttrName);
  }

  private buildRect(node: Element) {
    const matches = this._matchesSet.get<MatchObject[]>(node);
    if (matches) {
      matches.forEach(match => {
        const range = match.createRange();
        match.rect = range.getBoundingClientRect();
        range.detach(); // Releases the Range from use to improve performance.
      });
    }
  }

  private matchRect(node: Element, ev: MouseEvent) {
    const matches = this._matchesSet.get<MatchObject[]>(node);
    if (matches) {
      const hovered = matches.find(m => {
        return (
          m.rect &&
          m.rect.left <= ev.x &&
          ev.x <= m.rect.right &&
          m.rect.top <= ev.y &&
          ev.y <= m.rect.bottom
        );
      });
      if (hovered) {
        this.showHovered(hovered);
      } else {
        this.hideHovered();
      }
    }
  }

  private showHovered(hovered: MatchObject) {
    if (!this._lastHovered || this._lastHovered !== hovered) {
      this._lastHovered = hovered;
      this.props.hover(hovered);
    }
  }

  private hideHovered() {
    if (this._lastHovered) {
      this._lastHovered = null;
      this.props.hover(null);
    }
  }

  private observe(node: Node) {
    this._observer = new MutationObserver(mutationsList => {
      mutationsList.forEach(mutations => {
        switch (mutations.type) {
          case 'characterData':
            // 'target' is always text node
            this.stripMatches(mutations.target);
            this.searchMatches(mutations.target);
            break;

          case 'childList':
            mutations.removedNodes.forEach(node => {
              this.unbindValueNodes(node);
              this.stripMatches(node);
            });
            mutations.addedNodes.forEach(node => {
              this.bindValueNodes(node);
              this.searchMatches(node);
            });
            break;

          case 'attributes':
          default:
            break;
        }
      });
    });
    this._observer.observe(node, {
      attributes: false,
      characterData: true,
      childList: true,
      subtree: true
    });
  }

  private observeValueNode(node: Element) {
    const matched = this.props.matcher(node) || [];
    const matches = this._matchesSet.get(node, []);
    const hasMatched = matched.length > 0;
    const hasMatches = matches.length > 0;
    if (hasMatched !== hasMatches) {
      if (hasMatched) {
        matched.forEach(match => {
          this.addMatch(match);
        });
      } else {
        this.stripMatches(node);
      }
    }
  }

  destroy() {
    this._observer.disconnect();
    this.stripMatches(this.props.root);
    this.unbindValueNodes(this.props.root);
    this._matchesSet.clear();
  }
}

export default MatchWalker;
