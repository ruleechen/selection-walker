import { IMatch, IWalkerProps } from './interfaces';
import {
  getRcId,
  queryValueNodes,
  RcIdAttrName,
  LinkedRcIdPropName
} from './utilities';
import MatchObject from './MatchObject';
import DataSet from './DataSet';

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
    const imatches = this.props.matcher(node);
    imatches.forEach(imatch => {
      this.addMatch(imatch);
    });
  }

  addMatch(imatch: IMatch): MatchObject {
    if (!imatch) {
      throw new Error('[imatch] is required');
    }
    const match =
      imatch instanceof MatchObject ? imatch : new MatchObject(imatch);
    const target = match.getEventTarget();
    // cache matches
    const matches = this._matchesSet.get<MatchObject[]>(target, []);
    matches.push(match); //TODO: duplicate risk
    this._matchesSet.set(target, matches);
    // attach events
    this.removeNodeEvents(target);
    this.addNodeEvents(target);
    // ret
    return match;
  }

  removeMatch(match: MatchObject) {
    if (!match) {
      throw new Error('[match] is required');
    }
    const target = match.getEventTarget();
    let matches = this._matchesSet.get<MatchObject[]>(target);
    if (matches) {
      matches = matches.filter(x => x !== match);
      if (matches.length) {
        this._matchesSet.set(target, matches);
      } else {
        this.clearNodeMatches(target);
      }
    }
  }

  stripMatches(node: Node) {
    if (!node) {
      throw new Error('[node] is required');
    }
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_ALL);
    let current = walker.currentNode;
    while (current) {
      const linkedRcId = current[LinkedRcIdPropName];
      if (linkedRcId) {
        // unlink
        delete current[LinkedRcIdPropName];
        // find target
        let target: Element;
        const selector = `[${RcIdAttrName}="${linkedRcId}"]`;
        if (node instanceof Element) {
          target = node.querySelector(selector);
          if (!target && getRcId(node, false) === linkedRcId) {
            target = node;
          }
        }
        if (!target) {
          target = document.querySelector(selector);
        }
        // remove matchs
        if (target) {
          const matches = this._matchesSet.get<MatchObject[]>(target);
          if (matches) {
            matches
              .filter(match => {
                return match.contains(current);
              })
              .forEach(match => {
                this.removeMatch(match);
              });
          }
        }
      }
      current = walker.nextNode();
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
        match.buildRect();
      });
    }
  }

  private matchRect(node: Element, ev: MouseEvent) {
    const matches = this._matchesSet.get<MatchObject[]>(node);
    if (matches) {
      const hovered = matches.find(m => {
        return m.isMatch(ev.x, ev.y);
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
