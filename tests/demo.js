function isA(node) {
  return (
    node.tagName === 'A' &&
    (node.matches('a[href^="tel:"]') || node.matches('a[href^="sms:"]'))
  );
}

function processNode(node) {
  if (node.tagName === 'INPUT') {
    const numbers = libphonenumber.findNumbers(node.value, {
      v2: true
    });
    return numbers.map(function(item) {
      return {
        startsNode: node,
        startsAt: item.startsAt,
        endsNode: node,
        endsAt: item.endsAt,
        number: item.number
      };
    });
  }
  if (isA(node)) {
    return [
      {
        startsNode: node.firstChild,
        startsAt: 0,
        endsNode: node.firstChild,
        endsAt: node.innerText.length,
        number: null
      }
    ];
  }
  if (node.nodeType === 3) {
    const text = node.textContent.trim();
    const numbers = libphonenumber.findNumbers(text, {
      v2: true
    });
    return numbers.map(function(item) {
      return {
        startsNode: node,
        startsAt: item.startsAt,
        endsNode: node,
        endsAt: item.endsAt,
        number: item.number
      };
    });
  }
  return null;
}

class MyRule {
  init(container) {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_ALL,
      function(node) {
        return isA(node.parentNode)
          ? NodeFilter.FILTER_SKIP
          : NodeFilter.FILTER_ACCEPT;
      }
    );
    let founds = [];
    let node = walker.nextNode();
    while (node) {
      const res = processNode(node);
      if (res && res.length) {
        founds = founds.concat(res);
      }
      node = walker.nextNode();
    }
    return founds;
  }
  apply(mutations) {}
}

class MyWidget {
  render(root) {
    root.innerHTML = '<div style="border:1px solid #ccc">I am menu</div>';
  }
}

window.addEventListener('load', function() {
  const walker = new srect.Walker({
    container: document.body,
    widget: new MyWidget(),
    rule: new MyRule()
  });
  walker.start();
  window.swalker = walker;
});

/*
var p1 = document.querySelector('#p1');
var p2 = document.querySelector('#p2');
var range = document.createRange();
range.setStart(p1.firstChild, 5);
range.setEnd(p2.firstChild, 5);
var sele = window.getSelection();
sele.removeAllRanges();
sele.addRange(range);
console.log(range.getBoundingClientRect());
*/
