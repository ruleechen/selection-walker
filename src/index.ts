import {
  ISelectionRule,
  ISelectionBlock,
  IWidgetRender,
  IWalkerParams
} from './interfaces';

class Walker {
  _widgetRoot: HTMLElement;
  _blocks: { [key: string]: [ClientRect, ISelectionBlock] };

  constructor(private props: IWalkerParams) {
    this._blocks = {};
  }

  start() {
    this._observe();
    this._init();
  }

  _init() {
    this._renderWidget();
    const items = this.props.rule.init(this.props.container);
    this._appendBlocks(items);
  }

  _renderWidget() {
    if (this.props.widget) {
      this._widgetRoot = document.createElement('div');
      document.body.appendChild(this._widgetRoot);
      this._widgetRoot.style.position = 'absolute';
      this._widgetRoot.style.display = 'none';
      this.props.widget.render(this._widgetRoot);
    }
  }

  _processRules(mutations: MutationRecord[]) {
    const items = this.props.rule.apply(mutations);
    this._appendBlocks(items);
  }

  _observe() {
    const observer = new MutationObserver((mutationsList, observer) => {
      this._processRules(mutationsList);
    });
    observer.observe(this.props.container, {
      attributes: false,
      childList: true,
      subtree: false
    });
    let lastRect;
    const selection = window.getSelection();
    this.props.container.addEventListener('mousemove', (ev: MouseEvent) => {
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

            const range = document.createRange();
            if (block.startsNode.tagName === 'INPUT') {
              range.setStartBefore(block.startsNode);
              range.setEndAfter(block.endsNode);
            } else {
              range.setStart(block.startsNode, block.startsAt);
              range.setEnd(block.endsNode, block.endsAt);
            }
            selection.removeAllRanges();
            selection.addRange(range);

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
      const range = document.createRange();
      if (block.startsNode.tagName === 'INPUT') {
        range.setStartBefore(block.startsNode);
        range.setEndAfter(block.endsNode);
      } else {
        range.setStart(block.startsNode, block.startsAt);
        range.setEnd(block.endsNode, block.endsAt);
      }
      const rect = range.getBoundingClientRect();
      this._blocks[Math.random()] = [rect, block];
    });
  }
}

export default { Walker };
