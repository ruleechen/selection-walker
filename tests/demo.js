class MyRule extends selectionWalker.RuleBase {
  init(container) {
    const items = [];
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_ALL,
      null
    );
    var node = walker.nextNode();
    while (node) {
      if (node.nodeType === 3) {
        const text = node.textContent.trim();
        if (text) {
          const keyword = 'to';
          const index = text.indexOf(keyword);
          if (index !== -1) {
            const start = new selectionWalker.SelectionPoint({
              el: node,
              offset: index
            });
            const end = new selectionWalker.SelectionPoint({
              el: node,
              offset: index + keyword.length
            });
            items.push(
              new selectionWalker.SelectionBlock({
                start,
                end,
                key: Math.random().toString()
              })
            );
          }
        }
      }
      node = walker.nextNode();
    }
    return items;
  }
  apply(mutations) {}
}

class MyWidget extends selectionWalker.WidgetBase {
  render(root) {
    console.log('render my widget');
  }
}

window.addEventListener('load', () => {
  const walker = new selectionWalker.Walker({
    container: document.body,
    widget: new MyWidget(),
    rule: new MyRule()
  });
  walker.start();
});
