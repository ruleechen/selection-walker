import RuleBase from './RuleBase';
import WidgetBase from './WidgetBase';
import SelectionBlock from './SelectionBlock';

class Walker {
  _container: Node;
  _widget: WidgetBase;
  _rule: RuleBase;
  _blocks: { [key: string]: [ClientRect, SelectionBlock] };

  constructor({ container, widget, rule }) {
    this._container = container;
    this._widget = widget;
    this._rule = rule;
    this._blocks = {};
  }

  start() {
    this._observe();
    this._init();
  }

  _init() {
    const items = this._rule.init(this._container);
    this._appendBlocks(items);
  }

  _processRules(mutations: MutationRecord[]) {
    const items = this._rule.apply(mutations);
    this._appendBlocks(items);
  }

  _observe() {
    const observer = new MutationObserver((mutationsList, observer) => {
      this._processRules(mutationsList);
    });
    observer.observe(this._container, {
      attributes: false,
      childList: true,
      subtree: false
    });
    let lastRect;
    this._container.addEventListener('mousemove', (ev: MouseEvent) => {
      Object.keys(this._blocks).forEach(key => {
        const rect = this._blocks[key][0];
        const block = this._blocks[key][1];
        if (
          (!lastRect || lastRect !== rect) &&
          rect.left <= ev.x &&
          ev.x <= rect.right &&
          rect.top <= ev.y &&
          ev.y <= rect.bottom
        ) {
          lastRect = rect;
          const selection=window.getSelection();
          selection.removeAllRanges();
          selection.addRange(block.toRange());
          console.log('matched');
        }
      });
    });
  }

  _appendBlocks(blocks: SelectionBlock[]) {
    if (!blocks || !blocks.length) {
      return;
    }
    let cachedRange: Range = null;
    const selection = window.getSelection();
    if (selection.anchorNode) {
      cachedRange = selection.getRangeAt(0);
    }
    blocks.forEach(block => {
      const range = block.toRange();
      selection.removeAllRanges();
      selection.addRange(range);
      const rect = range.getBoundingClientRect();
      this._blocks[block.key()] = [rect, block];
    });
    selection.removeAllRanges();
    if (cachedRange) {
      selection.addRange(cachedRange);
    }
  }
}

export default Walker;
