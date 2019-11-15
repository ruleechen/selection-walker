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

let widgetRoot;
function isReject(node) {
  return (
    node.tagName === 'SCRIPT' ||
    widgetRoot === node ||
    widgetRoot.contains(node) ||
    (node.parentNode && isLinkNode(node.parentNode)) ||
    (node.parentNode && isValueNode(node.parentNode))
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

function myMatcher(node, children) {
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
      if (!children) {
        break;
      }
      current = treeWalker.nextNode();
    }
  }
  return founds;
}

window.addEventListener('load', function() {
  widgetRoot = document.createElement('RC-C2D-MENU');
  document.body.appendChild(widgetRoot);
  widgetRoot.innerHTML =
    '<div style="border:1px solid #ccc; background:#eee; cursor:pointer;">I am menu</div>';

  const widget = new smatch.UIWidget({
    root: widgetRoot
  });

  const observer = new smatch.MatchObserver({
    matcher: myMatcher,
    hover(target, match) {
      if (!match) {
        widget.hide();
        return;
      }
      if (match.context && match.context.number) {
        widgetRoot.firstChild.innerHTML = match.context.number;
        widget.show(match.rect);
      }
    },
    attributeFilter: ['href']
  });
  observer.observe(document.body);
  window.mobserver = observer;
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
