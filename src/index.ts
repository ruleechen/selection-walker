import { ISelectionRule, ISelectionBlock, IWidgetRender } from './interfaces';

class Walker {
  _container: HTMLElement;
  _widget: IWidgetRender;
  _widgetRoot: HTMLElement;
  _rule: ISelectionRule;
  _blocks: { [key: string]: [ClientRect, ISelectionBlock] };

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
    this._renderWidget();
    const items = this._rule.init(this._container);
    this._appendBlocks(items);
  }

  _renderWidget() {
    if (this._widget) {
      this._widgetRoot = document.createElement('div');
      document.body.appendChild(this._widgetRoot);
      this._widgetRoot.style.position = 'absolute';
      this._widgetRoot.style.display = 'none';
      this._widget.render(this._widgetRoot);
    }
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
    const selection = window.getSelection();
    this._container.addEventListener('mousemove', (ev: MouseEvent) => {
      const keys = Object.keys(this._blocks);
      for (let i = 0; i < keys.length; i++) {
        const item = this._blocks[keys[i]];
        const rect = item[0];
        if (
          rect.left <= ev.x &&
          ev.x <= rect.right &&
          rect.top <= ev.y &&
          ev.y <= rect.bottom
        ) {
          if (!lastRect || lastRect !== rect) {
            lastRect = rect;
            const block = item[1];
            if (block.startsNode.tagName !== 'INPUT') {
              const range = document.createRange();
              range.setStart(block.startsNode, block.startsAt);
              range.setEnd(block.endsNode, block.endsAt);
              selection.removeAllRanges();
              selection.addRange(range);
            }
            this._widgetRoot.style.display = 'block';
            this._widgetRoot.style.top = rect.top + 'px';
            this._widgetRoot.style.left = rect.right + 5 + 'px';
            break;
          }
        } else {
          lastRect = null;
          this._widgetRoot.style.display = 'none';
        }
      }
    });
  }

  _appendBlocks(blocks: ISelectionBlock[]) {
    if (!blocks || !blocks.length) {
      return;
    }
    blocks.forEach(block => {
      if (!block.startsNode) {
        return;
      }
      let rect: ClientRect;
      if (block.startsNode.tagName === 'INPUT') {
        rect = block.startsNode.getBoundingClientRect();
      } else {
        const range = document.createRange();
        range.setStart(block.startsNode, block.startsAt);
        range.setEnd(block.endsNode, block.endsAt);
        rect = range.getBoundingClientRect();
      }
      this._blocks[Math.random()] = [rect, block];
    });
  }
}

export default { Walker };
