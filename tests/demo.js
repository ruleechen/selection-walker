function phoneDetector(value) {
  const numbers = libphonenumber.findNumbers(value, 'US', {
    v2: true,
  });
  return numbers;
}

const includeValueTypes = true;
const valueNodeTypes = ['INPUT', 'SELECT', 'TEXTAREA'];
function isValueNode(node) {
  return valueNodeTypes.indexOf(node.tagName) !== -1;
}

function isAnchorNode(node) {
  const isMatched =
    node.tagName === 'A' &&
    (node.matches('a[href^="tel:"]') || node.matches('a[href^="sms:"]'));
  return isMatched;
}

const RC_C2D_NUMBER_TAGNAME = 'RC-C2D-NUMBER';
function isC2dNumberNode(node) {
  return node.tagName === RC_C2D_NUMBER_TAGNAME;
}

function isReject(node) {
  return (
    node.parentElement &&
    (isAnchorNode(node.parentElement) ||
      isValueNode(node.parentElement) ||
      isC2dNumberNode(node.parentElement))
  );
}

function processNode(node, detector) {
  const matches = [];
  if (node.nodeType === 1) {
    const element = node;
    if (isValueNode(element)) {
      if (includeValueTypes) {
        const valueElement = element;
        const items = detector(valueElement.value);
        for (const item of items) {
          matches.push({
            startsNode: valueElement,
            endsNode: valueElement,
            startsAt: item.startsAt,
            endsAt: item.endsAt,
            context: {
              number: item.number.number,
            },
          });
        }
      }
    } else if (isAnchorNode(element)) {
      const anchorElement = element;
      const items = detector(anchorElement.href);
      if (items.length) {
        matches.push({
          startsNode: anchorElement,
          endsNode: anchorElement,
          context: {
            number: items[0].number.number,
          },
        });
      }
    } else if (isC2dNumberNode(element)) {
      const innerText = element.innerText;
      matches.push({
        startsNode: element,
        endsNode: element,
        context: {
          number: innerText,
        },
      });
    }
  } else if (node.nodeType === 3) {
    const textNode = node;
    let offset = 0;
    let text = textNode.data.substr(offset);
    while (text.length) {
      const items = detector(text);
      if (!items || !items.length) {
        break;
      }
      for (const item of items) {
        matches.push({
          startsNode: textNode,
          endsNode: textNode,
          startsAt: offset + item.startsAt,
          endsAt: offset + item.endsAt,
          context: {
            number: item.number.number,
          },
        });
      }
      const lastItem = items[items.length - 1];
      offset += lastItem.endsAt;
      text = textNode.data.substr(offset);
    }
  }
  return matches;
}

function myMatcher(root, children) {
  const treeWalker = document.createTreeWalker(root, NodeFilter.SHOW_ALL, {
    acceptNode: function(node) {
      return isReject(node)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT;
    },
  });
  let founds = [];
  let current = treeWalker.currentNode;
  if (!isReject(current)) {
    while (current) {
      const res = processNode(current, phoneDetector);
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
  const widgetRoot = document.createElement('RC-C2D-MENU');
  document.body.appendChild(widgetRoot);
  widgetRoot.innerHTML =
    '<div style="border:1px solid #ccc; background:#eee; cursor:pointer;">I am menu</div>';

  const widget = new UIWidget({
    root: widgetRoot,
  });

  const observer = new smatch.MatchObserver({
    matcher: (node, children) => {
      return myMatcher(node, children).map((x) => {
        return {
          startsNode: x.startsNode,
          endsNode: x.endsNode,
          startsAt: x.startsAt,
          endsAt: x.endsAt,
          context: x.context,
        };
      });
    },
    onHoverIn(target, match) {
      if (match.context && match.context.number) {
        widgetRoot.firstChild.innerHTML = match.context.number;
        widget.show(match.rect);
        // test
        const range = match.createRange();
        const selection  = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
    },
    onHoverOut(target) {
      widget.hide();
    },
  });
  observer.observe(document.body);
  window._mObserver = observer;
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
