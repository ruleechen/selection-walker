function isLinkNode(node) {
  const isMatched =
    node.tagName === 'A' &&
    (node.matches('a[href^="tel:"]') || node.matches('a[href^="sms:"]'));
  return isMatched;
}

const valueNodeTypes = ['INPUT', 'SELECT', 'TEXTAREA'];
function isValueNode(node) {
  return valueNodeTypes.indexOf(node.tagName) !== -1;
}

function isReject(node) {
  return (
    node.tagName === 'SCRIPT' ||
    node.tagName === 'RC-C2D-MENU' ||
    isLinkNode(node.parentNode) ||
    isValueNode(node.parentNode)
  );
}

function processNode(node) {
  if (isValueNode(node)) {
    const numbers = libphonenumber.findNumbers(node.value, {
      v2: true
    });
    return numbers.map(function(item) {
      return {
        startsNode: node,
        startsAt: item.startsAt,
        endsNode: node,
        endsAt: item.endsAt,
        context: item.number
      };
    });
  }
  if (isLinkNode(node)) {
    return [
      {
        startsNode: node,
        startsAt: 0,
        endsNode: node,
        endsAt: node.innerText.length,
        context: {
          number: node.href
        }
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
        context: item.number
      };
    });
  }
  return null;
}

let widgetRoot;
let hideTmeoutId;

function hideWidget() {
  hideTmeoutId = setTimeout(function() {
    widgetRoot.style.display = 'none';
  }, 512);
}

function showWidget(match) {
  clearTimeout(hideTmeoutId);
  widgetRoot.style.display = 'block';
  widgetRoot.style.top = match.rect.top + window.pageYOffset + 'px';
  widgetRoot.style.left = match.rect.right + window.pageXOffset + 5 + 'px';
  if (match.context && match.context.number) {
    widgetRoot.firstChild.innerHTML = match.context.number;
  }
}

function initWidget() {
  widgetRoot = document.createElement('RC-C2D-MENU');
  document.body.appendChild(widgetRoot);
  widgetRoot.innerHTML =
    '<div style="border:1px solid #ccc; background:#eee; cursor:pointer;">I am menu</div>';
  widgetRoot.style.position = 'absolute';
  widgetRoot.style.display = 'none';
  widgetRoot.style.zIndex = 10000;

  widgetRoot.addEventListener('mouseenter', function() {
    clearTimeout(hideTmeoutId);
  });
  widgetRoot.addEventListener('mouseleave', function() {
    hideWidget();
  });
}

function myMatcher(node) {
  if (node === widgetRoot || widgetRoot.contains(node)) {
    return;
  }
  const treeWalker = document.createTreeWalker(
    node,
    NodeFilter.SHOW_ALL,
    function(nextNode) {
      return isReject(nextNode)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT;
    }
  );
  let founds = [];
  let current = treeWalker.currentNode;
  if (!isReject(current)) {
    while (current) {
      const res = processNode(current);
      if (res && res.length) {
        founds = founds.concat(res);
      }
      current = treeWalker.nextNode();
    }
  }
  return founds;
}

window.addEventListener('load', function() {
  initWidget();

  const walker = new smatch.MatchWalker({
    root: document.body,
    matcher: myMatcher,
    hover(match) {
      if (match) {
        showWidget(match);
      } else {
        hideWidget();
      }
    }
  });
  walker.start();
  window.mwalker = walker;
});

/*
const selection = window.getSelection();
const range = match.createRange();
selection.removeAllRanges();
selection.addRange(range);

var p1 = document.querySelector('#p1');
var p2 = document.querySelector('#p2');
var range = document.createRange();
range.setStart(p1.firstChild, 5);
range.setEnd(p2.firstChild, 5);
var sele = window.getSelection();
sele.removeAllRanges();
sele.addRange(range);
console.log(range.getBoundingClientRect());s
*/
