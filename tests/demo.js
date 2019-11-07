function isA(node) {
  const isMatched =
    node.tagName === 'A' &&
    (node.matches('a[href^="tel:"]') || node.matches('a[href^="sms:"]'));
  return isMatched;
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
        startsNode: node,
        startsAt: 0,
        endsNode: node,
        endsAt: node.innerText.length,
        number: null
      }
    ];
  }
  if (node.nodeType === 3) {
    const numbers = libphonenumber.findNumbers(node.data, {
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

function myMatcher(container) {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_ALL,
    function(node) {
      if (node.tagName === 'RC-C2D-MENU' || node.tagName === 'SCRIPT') {
        return NodeFilter.FILTER_SKIP;
      }
      return isA(node.parentNode)
        ? NodeFilter.FILTER_SKIP
        : NodeFilter.FILTER_ACCEPT;
    }
  );
  let founds = [];
  let node = walker.currentNode;
  if (!isA(node.parentNode)) {
    while (node) {
      const res = processNode(node);
      if (res && res.length) {
        founds = founds.concat(res);
      }
      node = walker.nextNode();
    }
  }
  return founds;
}

window.addEventListener('load', function() {
  const widgetRoot = document.createElement('RC-C2D-MENU');
  document.body.appendChild(widgetRoot);
  widgetRoot.innerHTML =
    '<div style="border:1px solid #ccc; background:#eee;">I am menu</div>';
  widgetRoot.style.position = 'absolute';
  widgetRoot.style.display = 'none';
  widgetRoot.style.zIndex = 10000;

  const myHover = function(match) {
    if (match) {
      // display
      widgetRoot.style.display = 'block';
      widgetRoot.style.top = match.rect.top + window.pageYOffset + 'px';
      widgetRoot.style.left = match.rect.right + window.pageXOffset + 5 + 'px';
      // select
      const selection = window.getSelection();
      const range = smatch.MatchWalker.createRange(match);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // hide
      widgetRoot.style.display = 'none';
    }
  };

  const walker = new smatch.MatchWalker({
    root: document.body,
    matcher: myMatcher,
    hover: myHover
  });
  walker.start();
  window.mWalker = walker;
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
