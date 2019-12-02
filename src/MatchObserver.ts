import { MatchProps, ObserverProps } from './interfaces';
import MatchObject from './MatchObject';
import {
  queryValueNodes,
  upFirstValueNode,
  throttled,
  Throttler,
} from './utilities';

export const DEFAULT_OBSERVER_OPTIONS: MutationObserverInit = {
  attributeFilter: ['href'],
  attributes: true,
  subtree: true,
  childList: true,
  characterData: true,
};

class EventDelayThrottler implements Throttler {
  private _delay: number;
  private _timeSet: Map<Element, number>;

  constructor(delay: number) {
    this._delay = delay;
    this._timeSet = new Map<Element, number>();
  }

  valid(ev: Event) {
    if (ev.target === ev.currentTarget) {
      const element = ev.target as Element;
      const last = this._timeSet.get(element) || 0;
      const now = Date.now();
      if (now - last > this._delay) {
        this._timeSet.set(element, now);
        return true;
      }
    }
    return false;
  }

  remove(key: Element): boolean {
    return this._timeSet.delete(key);
  }
}

class MatchObserver {
  private _currentRoot: Node;
  private _mutationObserver: MutationObserver;
  private _linkedMap: Map<Node, Element>;
  private _matchesMap: Map<Element, MatchObject[]>;
  private _throttler: EventDelayThrottler;
  private _mouseenterHandler: EventListener;
  private _mouseleaveHandler: EventListener;
  private _mousemoveHandler: EventListener;
  private _changeHandler: EventListener;
  private _lastHovered: MatchObject;

  constructor(private _props: ObserverProps) {
    if (!this._props.matcher) {
      throw new Error('Prop [matcher] is required');
    }
    this._linkedMap = new Map<Node, Element>();
    this._matchesMap = new Map<Element, MatchObject[]>();
    this._throttler = new EventDelayThrottler(100);
    // event handlers
    // ev.target is what triggers the event dispatcher to trigger
    // ev.currentTarget is what you assigned your listener to
    this._mouseenterHandler = (ev: MouseEvent) => {
      if (ev.target === ev.currentTarget) {
        this._buildRect(ev.target as Element);
      }
    };
    this._mouseleaveHandler = (ev: MouseEvent) => {
      if (ev.target === ev.currentTarget) {
        this._hideHovered(ev.target as Element);
      }
    };
    this._mousemoveHandler = throttled(this._throttler, (ev: MouseEvent) => {
      if (ev.target === ev.currentTarget) {
        this._matchRect(ev.target as Element, ev);
      }
    });
    this._changeHandler = (ev: Event) => {
      if (ev.target === ev.currentTarget) {
        this._observeValueNode(ev.target as Element);
      }
    };
  }

  observe(node: Node) {
    if (this._currentRoot) {
      throw new Error('Observer is running');
    }
    this._observeMutation(node);
    this._bindValueNodes(node);
    this._searchMatches(node);
    this._currentRoot = node;
  }

  private _searchMatches(node: Node, children: boolean = true) {
    if (!node) {
      throw new Error('[node] is required');
    }
    const matched = this._proceedMatch(node, children);
    if (matched) {
      for (const match of matched) {
        this.addMatch(match);
      }
    }
  }

  private _proceedMatch(node: Node, children: boolean = true): MatchProps[] {
    const matched = this._props.matcher(node, children);
    return matched;
  }

  addMatch(matchProps: MatchProps | MatchObject): MatchObject {
    if (!matchProps) {
      throw new Error('[matchProps] is required');
    }
    const match =
      matchProps instanceof MatchObject
        ? matchProps
        : new MatchObject(matchProps);
    const target = match.getEventTarget();
    // setup link
    this._linkedMap.set(match.startsNode, target);
    this._linkedMap.set(match.endsNode, target);
    // cache matches
    const matches = this._matchesMap.get(target) || [];
    matches.push(match); // TODO: duplicate risk
    this._matchesMap.set(target, matches);
    // attach events
    this._removeNodeEvents(target);
    this._addNodeEvents(target);
    // ret
    return match;
  }

  removeMatch(match: MatchObject) {
    if (!match) {
      throw new Error('[match] is required');
    }
    const target = match.getEventTarget();
    let matches = this._matchesMap.get(target);
    if (matches) {
      // exclude
      matches = matches.filter((x) => x !== match);
      // unlink
      if (!matches.some((x) => x.contains(match.startsNode))) {
        this._linkedMap.delete(match.startsNode);
      }
      if (!matches.some((x) => x.contains(match.endsNode))) {
        this._linkedMap.delete(match.endsNode);
      }
      // update
      if (matches.length) {
        this._matchesMap.set(target, matches);
      } else {
        this._removeNodeEvents(target);
        this._matchesMap.delete(target);
        this._throttler.remove(target);
      }
    }
  }

  stripMatches(node: Node, children: boolean = true) {
    if (!node) {
      throw new Error('[node] is required');
    }
    // when strip the root node it means to strip all the matched
    // so just strip all the matched instead of walking through the DOM
    if (node === this._currentRoot) {
      const allMatches = Array.from(this._matchesMap.values());
      for (const matches of allMatches) {
        for (const match of matches) {
          this.removeMatch(match);
        }
      }
      return;
    }
    // strip the specified node
    const treeWalker = document.createTreeWalker(node, NodeFilter.SHOW_ALL);
    let current = treeWalker.currentNode;
    while (current) {
      const linkedElement = this._linkedMap.get(current);
      if (linkedElement) {
        const matches = this._matchesMap.get(linkedElement);
        if (matches) {
          for (const match of matches) {
            if (match.contains(current)) {
              this.removeMatch(match);
            }
          }
        }
      }
      if (!children) {
        break;
      }
      current = treeWalker.nextNode();
    }
  }

  // https://api.jquery.com/mouseenter/
  private _addNodeEvents(node: Element) {
    node.addEventListener('mouseenter', this._mouseenterHandler);
    node.addEventListener('mouseleave', this._mouseleaveHandler);
    node.addEventListener('mousemove', this._mousemoveHandler);
  }

  private _removeNodeEvents(node: Element) {
    node.removeEventListener('mouseenter', this._mouseenterHandler);
    node.removeEventListener('mouseleave', this._mouseleaveHandler);
    node.removeEventListener('mousemove', this._mousemoveHandler);
  }

  private _bindValueNodes(node: Node) {
    if (node instanceof Element) {
      const valueNodes = queryValueNodes(node);
      for (const node of valueNodes) {
        node.addEventListener('change', this._changeHandler);
      }
    }
  }

  private _unbindValueNodes(node: Node) {
    if (node instanceof Element) {
      const valueNodes = queryValueNodes(node);
      for (const node of valueNodes) {
        node.removeEventListener('change', this._changeHandler);
      }
    }
  }

  private _buildRect(target: Element) {
    const matches = this._matchesMap.get(target);
    if (matches) {
      for (const match of matches) {
        match.buildRect();
      }
    }
  }

  private _matchRect(target: Element, ev: MouseEvent) {
    const matches = this._matchesMap.get(target);
    if (matches) {
      const hovered = matches.find((m) => {
        return m.isMatch(ev.x, ev.y);
      });
      if (hovered) {
        this._showHovered(target, hovered);
      } else {
        this._hideHovered(target);
      }
    }
  }

  private _showHovered(target: Element, hovered: MatchObject) {
    if (!this._lastHovered || this._lastHovered !== hovered) {
      this._lastHovered = hovered;
      if (this._props.onHoverIn) {
        this._props.onHoverIn(target, hovered);
      }
    }
  }

  private _hideHovered(target: Element) {
    if (this._lastHovered) {
      this._lastHovered = null;
      if (this._props.onHoverOut) {
        this._props.onHoverOut(target);
      }
    }
  }

  private _observeMutation(node: Node) {
    this._mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        switch (mutation.type) {
          case 'characterData': {
            // here the 'target' is always a text node
            const valueNode = upFirstValueNode(mutation.target.parentNode);
            if (valueNode) {
              this._observeValueNode(valueNode);
            } else {
              this.stripMatches(mutation.target);
              this._searchMatches(mutation.target);
            }
            break;
          }

          case 'attributes': {
            // re-build the 'target' node's matches. its children is not need
            const valueNode = upFirstValueNode(mutation.target.parentNode);
            if (valueNode) {
              this._observeValueNode(valueNode);
            } else {
              this.stripMatches(mutation.target, false);
              this._searchMatches(mutation.target, false);
            }
            break;
          }

          case 'childList': {
            // here the 'target' is the parent of node being removed/added
            const valueNode = upFirstValueNode(mutation.target);
            if (valueNode) {
              this._observeValueNode(valueNode);
            } else {
              mutation.removedNodes.forEach((node) => {
                this._unbindValueNodes(node);
                this.stripMatches(node);
              });
              mutation.addedNodes.forEach((node) => {
                this._bindValueNodes(node);
                this._searchMatches(node);
              });
            }
            break;
          }

          default:
            break;
        }
      }
    });
    const options = this._props.observerOptions || DEFAULT_OBSERVER_OPTIONS;
    this._mutationObserver.observe(node, options);
  }

  private _observeValueNode(node: Element) {
    this.stripMatches(node);
    const matched = this._proceedMatch(node);
    if (matched) {
      for (const match of matched) {
        this.addMatch(match);
      }
    }
  }

  disconnect() {
    this._mutationObserver.disconnect();
    this.stripMatches(this._currentRoot);
    this._unbindValueNodes(this._currentRoot);
    this._linkedMap.clear();
    this._matchesMap.clear();
    this._lastHovered = null;
    this._currentRoot = null;
  }
}

export default MatchObserver;
