var React = require('react');
var ReactDOM = require('react-dom');
var TestUtils = require('react-addons-test-utils');
var Immutable = require('immutable');
var sinon = require('sinon');
var expect = require('expect.js');

var TestTemplates = require('./ItemBox-TestTemplate')
  , TestTemplate = TestTemplates.default
  , TestTemplate2 = TestTemplates.alternate;

const KEY_CODE_LEFT = 37;
const KEY_CODE_RIGHT = 39;
const KEY_CODE_DELETE = 48;
const KEY_CODE_BACKSPACE = 8;
const KEY_CODE_COMMA  = 188;
const KEY_CODE_TAB    = 9;
const KEY_CODE_ESCAPE = 27;

const DEFAULT_ITEMS = Immutable.fromJS([
  { template: TestTemplate, data: { id: 1, text: 'aaa' } },
  { template: TestTemplate, data: { id: 2, text: 'bbb' } }
]);

var _safeRenderCount = 0;
function safeRender(element) {
  var elem = document.createElement('div');
  elem.className = 'saferender test_' + _safeRenderCount++;
  document.body.appendChild(elem);
  return ReactDOM.render(element, elem);
}

function rerender(reactNode, component, newProps) {
  return (
    ReactDOM.render(
      React.createElement(component, newProps),
      ReactDOM.findDOMNode(reactNode).parentNode
    )
  );
}

function getExpectedEntryWidth(viewComponent) {
  var viewWidth = ReactDOM.findDOMNode(viewComponent).clientWidth;
  var itemWidth = 0;
  var itemComponents = TestUtils.scryRenderedDOMComponentsWithClass(viewComponent, TestTemplate.templateClass);
  itemWidth = Math.ceil(ReactDOM.findDOMNode(itemComponents[itemComponents.length - 1]).getBoundingClientRect().right);
  var remainingWidth = viewWidth - itemWidth;
  return remainingWidth;
}

describe('ItemBox', function() {
  var TestComponent, sandbox, allowWarnings, mockOnChange, mockInput, items;

  beforeEach(function() {
    TestComponent = require('../ItemBox');
    mockOnChange = sinon.spy();
    mockInput = function(e) { mockOnChange({ target: { value: e.target.value } }); };
    sandbox = sinon.sandbox.create();
    sandbox.stub(console, 'warn');
    allowWarnings = false;
    items = DEFAULT_ITEMS;
  });

  afterEach(function() {
    if(!allowWarnings) { sinon.assert.notCalled(console.warn); }
    sandbox.restore();
  });

  it('should have an input element containing the value prop', function() {
    var value = 'xyzzy';
    var view = TestUtils.renderIntoDocument(<TestComponent value={value} onChange={mockOnChange} />);
    var check = TestUtils.scryRenderedDOMComponentsWithTag(view, 'input');
    expect(check.length).to.be(1);
    expect(ReactDOM.findDOMNode(check[0]).value).to.be(value);
  });

  it('should call onChange when the user changes the entry value', function() {
    var value = 'xyzzy';
    var view = TestUtils.renderIntoDocument(<TestComponent value={value} onChange={mockInput} />);
    var check = TestUtils.scryRenderedDOMComponentsWithTag(view, 'input');

    TestUtils.Simulate.change(check[0], { target: { value: 'aaa' } });

    expect(ReactDOM.findDOMNode(check[0]).value).to.be(value);
    expect(mockOnChange.called).to.be.ok();
    expect(mockOnChange.args[0][0].target.value).to.be('aaa');
  });

  it('should render each item, in order, with a default itemTemplate', function() {
    var itemsWithoutTemplates = Immutable.fromJS([
      { data: { id: 1, text: 'aaa' } },
      { data: { id: 2, text: 'bbb' } }
    ]);
    var view = safeRender(<TestComponent value="" items={itemsWithoutTemplates} />);
    var check = TestUtils.scryRenderedDOMComponentsWithClass(view, 'item');
    expect(check.length).to.be(2);
    expect(ReactDOM.findDOMNode(check[0]).textContent).to.contain(itemsWithoutTemplates.getIn([0, 'data', 'text']));
  });

  it('should render each item, in order, with the itemTemplate prop', function() {
    var view = TestUtils.renderIntoDocument(<TestComponent value="" onChange={mockOnChange} items={items} />);
    var check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);
    expect(check.length).to.be(2);
    for(var i = 0; i < check.length; i++) {
      expect(ReactDOM.findDOMNode(check[i]).textContent).to.be(items.getIn([i, 'data', 'text']));
    }
  });

  it('should accept a default template to use (itemTemplate) when the item does not specify its own template', function() {
    var itemsWithMixedTemplates = Immutable.fromJS([
      { data: { id: 1, text: 'aaa' }, template: TestTemplate },
      { data: { id: 2, text: 'bbb' } }
    ]);
    var view = safeRender(<TestComponent value="" items={itemsWithMixedTemplates} itemTemplate={TestTemplate2} />);
    expect(TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass).length).to.be(1);
    expect(TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate2.templateClass).length).to.be(1);
  });

  it('should put the entry point on the same line as the last item', function() {
    var view = safeRender(<TestComponent value="" onChange={mockOnChange} items={items} itemTemplate={TestTemplate} />);
    var check = TestUtils.findRenderedDOMComponentWithTag(view, 'input');

    var itemComponents = TestUtils.scryRenderedDOMComponentsWithTag(view, 'li');
    var expectedOffsetTop = ReactDOM.findDOMNode(itemComponents[0]).offsetTop;

    // this is a little bit fuzzy because some browsers offset the input differently
    // in practice, I have found that +/- 4 is pretty close without entering the wrong line territory
    expect(ReactDOM.findDOMNode(check).offsetTop).to.be.within(expectedOffsetTop - 4, expectedOffsetTop + 4);
    expect(ReactDOM.findDOMNode(check).style.width).not.to.be(0);
  });

  it('should move the entry point to the next line if the text string is too long for the remaining space', function() {
    var extraItems = Immutable.fromJS([
      { data: { id: 1, text: 'aaa' } },
      { data: { id: 2, text: 'bbb' } },
      { data: { id: 2, text: 'ccc' } },
      { data: { id: 2, text: 'ddd' } },
      { data: { id: 2, text: 'eee' } }
    ]);
    var view = safeRender(<TestComponent value="" onChange={mockOnChange} items={extraItems} itemTemplate={TestTemplate} />);
    var itemComponents = TestUtils.scryRenderedDOMComponentsWithTag(view, 'li');
    var wrapWidth = Math.ceil(
      ReactDOM.findDOMNode(itemComponents[itemComponents.length - 1]).getBoundingClientRect().right
    );
    ReactDOM.findDOMNode(view).parentNode.style.width = '' + (wrapWidth + 80) + 'px';
    var check = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
    rerender(
      view,
      TestComponent,
      {value: 'xyzzyxyzzyxyzzyxyzzyxyzzy', onChange: mockOnChange, items: extraItems, itemTemplate: TestTemplate }
    );
    expect(ReactDOM.findDOMNode(check).offsetTop).to.be.greaterThan(ReactDOM.findDOMNode(itemComponents[0]).offsetTop + 4);

    // the input should map to the full width of new line
    var fullWidth = ReactDOM.findDOMNode(view).clientWidth;
    expect(ReactDOM.findDOMNode(check).style.width).to.be(fullWidth + 'px');
  });

  it('should set the width of the text entry point to the remaining space in the box', function() {
    var view = safeRender(<TestComponent value="" onChange={mockOnChange} items={items} />);
    var inputWidth = ReactDOM.findDOMNode(TestUtils.findRenderedDOMComponentWithTag(view, 'input')).style.width;
    expect(inputWidth).to.be(getExpectedEntryWidth(view) + 'px');
  });

  it('should resize the text entry point to respond to changing sizes', function(done) {
    var view = safeRender(<TestComponent value="" onChange={mockOnChange} items={items} />);
    var check = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
    var inputWidth = ReactDOM.findDOMNode(check).style.width;
    ReactDOM.findDOMNode(view).style.width = '500px';
    setTimeout(function() {
      inputWidth = ReactDOM.findDOMNode(check).style.width;
      expect(inputWidth).to.be(getExpectedEntryWidth(view) + 'px');
      done();
    }, 50);
  });

  describe('item selection', function() {
    it('should not show any items as selected when the entry field has focus', function() {
      var view = safeRender(<TestComponent value="" onChange={mockOnChange} items={items} />);
      var check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.selectedClass);
      expect(check.length).to.be(0);
    });
    it('should mark an item as selected when clicked', function() {
      var view = TestUtils.renderIntoDocument(<TestComponent items={items} />);
      var check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);
      TestUtils.Simulate.click(check[0]);
      expect(ReactDOM.findDOMNode(check[0]).className).to.contain(TestTemplate.selectedClass);
    });
    it('should focus on the item when clicked', function() {
      var view = safeRender(<TestComponent items={items} />);
      var itemComponents = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);
      TestUtils.Simulate.click(itemComponents[0]);
      expect(ReactDOM.findDOMNode(itemComponents[0]).parentNode).to.be(document.activeElement);
    });
    it('should select none when the focus on an item blurs', function(done) {
      var view = safeRender(<TestComponent items={items} />);
      var check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);
      TestUtils.Simulate.click(check[1]);
      setTimeout(function() {
        TestUtils.Simulate.blur(check[1]);
        expect(TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.selectedClass).length).to.be(0);
        done();
      }, 50);
    });
    it('should mark the previous item as selected when hitting the left arrow', function() {
      var view = safeRender(<TestComponent items={items} />);
      var check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);
      TestUtils.Simulate.click(check[1]);
      TestUtils.Simulate.keyDown(check[1], { keyCode: KEY_CODE_LEFT });
      expect(ReactDOM.findDOMNode(check[0]).className).to.contain(TestTemplate.selectedClass);
      expect(ReactDOM.findDOMNode(check[1]).className).not.to.contain(TestTemplate.selectedClass);
    });
    it('should mark the next item as selected when hitting the right arrow', function() {
      var view = safeRender(<TestComponent items={items} />);
      var check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);
      TestUtils.Simulate.click(check[0]);
      TestUtils.Simulate.keyDown(check[0], { keyCode: KEY_CODE_RIGHT });
      expect(ReactDOM.findDOMNode(check[0]).className).not.to.contain(TestTemplate.selectedClass);
      expect(ReactDOM.findDOMNode(check[1]).className).to.contain(TestTemplate.selectedClass);
    });
    it('should keep the first item selected when hitting the left arrow on the first item', function() {
      var view = safeRender(<TestComponent items={items} />);
      var check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);
      TestUtils.Simulate.click(check[0]);
      TestUtils.Simulate.keyDown(check[0], { keyCode: KEY_CODE_LEFT });
      expect(ReactDOM.findDOMNode(check[0]).className).to.contain(TestTemplate.selectedClass);
      expect(ReactDOM.findDOMNode(check[0]).parentNode).to.be(document.activeElement);
    });
    it('should select the last item when hitting the left arrow key from the left most position of the entry field', function() {
      var view = safeRender(<TestComponent items={items} />);
      var check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);
      var entry = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
      TestUtils.Simulate.click(entry);
      TestUtils.Simulate.keyDown(entry, { keyCode: KEY_CODE_LEFT });
      var item = ReactDOM.findDOMNode(check[items.size-1]);
      expect(item.className).to.contain(TestTemplate.selectedClass);
      expect(item.parentNode).to.be(document.activeElement);
    });
    it('should select the last item when hitting the backspace key from the first position of the entry field', function() {
      var view = safeRender(<TestComponent items={items} />);
      var check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);
      var entry = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
      TestUtils.Simulate.click(entry);
      TestUtils.Simulate.keyUp(entry, { keyCode: KEY_CODE_BACKSPACE });
      var item = ReactDOM.findDOMNode(check[items.size-1]);
      expect(item.className).to.contain(TestTemplate.selectedClass);
      expect(item.parentNode).to.be(document.activeElement);
    });
    it('should mark no items as selected when hitting the right arrow while the last item is selected', function() {
      var view = safeRender(<TestComponent items={items} />);
      var check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);
      TestUtils.Simulate.click(check[1]);
      TestUtils.Simulate.keyDown(check[1], { keyCode: KEY_CODE_RIGHT });
      check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.selectedClass);
      expect(check.length).to.be(0);
    });
    it('should select the entry field when hitting the right arrow key from the last item', function() {
      var view = safeRender(<TestComponent items={items} />);
      var check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);
      TestUtils.Simulate.click(check[1]);
      TestUtils.Simulate.keyDown(check[1], { keyCode: KEY_CODE_RIGHT });
      var inputNode = ReactDOM.findDOMNode(TestUtils.findRenderedDOMComponentWithTag(view, 'input'));
      expect(inputNode).to.be(document.activeElement);
    });
    it('should be able to move through all of the items with no problems', function() {
      var extraItems = Immutable.fromJS([
        { data: { id: 1, text: 'aaa' } },
        { data: { id: 2, text: 'bbb' } },
        { data: { id: 2, text: 'ccc' } },
        { data: { id: 2, text: 'ddd' } },
        { data: { id: 2, text: 'eee' } }
      ]);
      var view = safeRender(<TestComponent items={extraItems} itemTemplate={TestTemplate} />);
      var check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);

      var selectedItem = extraItems.size - 1;
      TestUtils.Simulate.click(check[selectedItem]);

      TestUtils.Simulate.keyDown(check[selectedItem], { keyCode: KEY_CODE_LEFT });
      expect(ReactDOM.findDOMNode(check[selectedItem-1]).className).to.contain(TestTemplate.selectedClass);
      expect(ReactDOM.findDOMNode(check[selectedItem]).className).not.to.contain(TestTemplate.selectedClass);

      selectedItem = selectedItem - 1;
      TestUtils.Simulate.keyDown(check[selectedItem], { keyCode: KEY_CODE_LEFT });
      expect(ReactDOM.findDOMNode(check[selectedItem-1]).className).to.contain(TestTemplate.selectedClass);
      expect(ReactDOM.findDOMNode(check[selectedItem]).className).not.to.contain(TestTemplate.selectedClass);

      TestUtils.Simulate.keyDown(check[selectedItem], { keyCode: KEY_CODE_RIGHT });
      expect(ReactDOM.findDOMNode(check[selectedItem]).className).to.contain(TestTemplate.selectedClass);
      expect(ReactDOM.findDOMNode(check[selectedItem-1]).className).not.to.contain(TestTemplate.selectedClass);
    });
  });

  describe('removing items', function() {
    it('should call onRemove with the selected item when hitting the delete keys', function() {
      var view = safeRender(<TestComponent items={items} onRemove={mockOnChange} />);
      var check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);
      TestUtils.Simulate.click(check[1]);
      expect(mockOnChange.called).not.to.be.ok();
      TestUtils.Simulate.keyDown(check[1], { keyCode: KEY_CODE_DELETE });
      expect(mockOnChange.called).not.to.be.ok();
      TestUtils.Simulate.keyUp(check[1], { keyCode: KEY_CODE_DELETE });
      expect(mockOnChange.called).to.be.ok();
      expect(mockOnChange.args[0][0]).to.be(1);
    });
    it('should call onRemove with the selected item when hitting the backspace keys (onKeyUp so no repeats)', function() {
      var view = safeRender(<TestComponent items={items} onRemove={mockOnChange} />);
      var check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);
      var mockPreventDefault = sinon.spy();
      TestUtils.Simulate.click(check[1]);
      expect(mockOnChange.called).not.to.be.ok();
      TestUtils.Simulate.keyDown(check[1], { keyCode: KEY_CODE_BACKSPACE });
      expect(mockOnChange.called).not.to.be.ok();
      TestUtils.Simulate.keyUp(check[1], { keyCode: KEY_CODE_BACKSPACE, preventDefault: mockPreventDefault });
      expect(mockOnChange.called).to.be.ok();
      expect(mockOnChange.args[0][0]).to.be(1);
      expect(mockPreventDefault.callCount).to.be(1);
    });
    it('should call onRemove with the selected item when the item self reports a onRemove operation', function() {
      var view = TestUtils.renderIntoDocument(<TestComponent items={items} onRemove={mockOnChange} />);
      var check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.deleteButtonClass);
      TestUtils.Simulate.click(check[1]);
      expect(mockOnChange.called).to.be.ok();
      expect(mockOnChange.args[0][0]).to.be(1);
    });
  });

  describe('input level event handlers', function() {
    it('should support onKeyUp', function() {
      var mockKeyUp = sinon.spy();
      var view = TestUtils.renderIntoDocument(<TestComponent value="" onChange={mockOnChange} items={items} onKeyUp={mockKeyUp} />);
      var input = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
      TestUtils.Simulate.keyUp(input, { keyCode: KEY_CODE_COMMA });
      expect(mockKeyUp.called).to.be.ok();
    });
    it('should support onKeyDown', function() {
      var mockKeyDown = sinon.spy();
      var view = TestUtils.renderIntoDocument(<TestComponent value="" onChange={mockOnChange} items={items} onKeyDown={mockKeyDown} />);
      var input = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
      TestUtils.Simulate.keyDown(input, { keyCode: KEY_CODE_COMMA });
      expect(mockKeyDown.called).to.be.ok();
    });
    it('should support onCopy', function() {
      var someData = 'clipboard stuff';
      var mockOnCopy = sinon.spy();
      var view = TestUtils.renderIntoDocument(<TestComponent value="" onChange={mockOnChange} items={items} onCopy={mockOnCopy} />);
      var input = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
      TestUtils.Simulate.copy(input, { clipboardData: someData });
      expect(mockOnCopy.called).to.be.ok();
      expect(mockOnCopy.args[0][0].clipboardData).to.be(someData);
    });
    it('should support onCut', function() {
      var someData = 'clipboard stuff';
      var mockOnCut = sinon.spy();
      var view = TestUtils.renderIntoDocument(<TestComponent value="" onChange={mockOnChange} items={items} onCut={mockOnCut} />);
      var input = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
      TestUtils.Simulate.cut(input, { clipboardData: someData });
      expect(mockOnCut.called).to.be.ok();
      expect(mockOnCut.args[0][0].clipboardData).to.be(someData);
    });
    it('should support onPaste', function() {
      var someData = 'clipboard stuff';
      var mockOnPaste = sinon.spy();
      var view = TestUtils.renderIntoDocument(<TestComponent value="" onChange={mockOnChange} items={items} onPaste={mockOnPaste} />);
      var input = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
      TestUtils.Simulate.paste(input, { clipboardData: someData });
      expect(mockOnPaste.called).to.be.ok();
      expect(mockOnPaste.args[0][0].clipboardData).to.be(someData);
    });
    it('should support onInputFocus', function() {
      var mockOnFocus = sinon.spy();
      var view = TestUtils.renderIntoDocument(<TestComponent value="" onChange={mockOnChange} items={items} onInputFocus={mockOnFocus} />);
      var input = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
      TestUtils.Simulate.focus(input);
      expect(mockOnFocus.called).to.be.ok();
    });
    it('should support onInputBlur', function() {
      var mockOnBlur = sinon.spy();
      var view = TestUtils.renderIntoDocument(<TestComponent value="" onChange={mockOnChange} items={items} onInputBlur={mockOnBlur} />);
      var input = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
      TestUtils.Simulate.blur(input);
      expect(mockOnBlur.called).to.be.ok();
    });
  });

  describe('component level event handlers', function() {
    it('should support onFocus from nothing to the input element', function() {
      var mockEventHandler = sinon.spy();
      var view = safeRender(<TestComponent value="" onChange={mockOnChange} items={items} onFocus={mockEventHandler} />);
      var input = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
      var itemComponents = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);

      TestUtils.Simulate.focus(input);
      expect(mockEventHandler.called).to.be.ok();

      TestUtils.Simulate.click(itemComponents[0]);
      expect(mockEventHandler.calledTwice).not.to.be.ok();

      TestUtils.Simulate.focus(input);
      expect(mockEventHandler.calledTwice).not.to.be.ok();
    });
    it('should support onFocus from nothing to the item list elements', function() {
      var mockEventHandler = sinon.spy();
      var view = safeRender(<TestComponent value="" onChange={mockOnChange} items={items} onFocus={mockEventHandler} />);
      var input = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
      var itemComponents = TestUtils.scryRenderedDOMComponentsWithTag(view, 'li');

      TestUtils.Simulate.click(itemComponents[0]);
      expect(mockEventHandler.called).to.be.ok();

      TestUtils.Simulate.click(itemComponents[1]);
      expect(mockEventHandler.calledTwice).not.to.be.ok();

      ReactDOM.findDOMNode(input).focus();
      expect(mockEventHandler.calledTwice).not.to.be.ok();
    });
    it('should support onBlur', function(done) {
      var mockEventHandler = sinon.spy();
      var view = safeRender(<TestComponent value="" onChange={mockOnChange} items={items} onBlur={mockEventHandler} />);
      var input = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
      var itemComponents = TestUtils.scryRenderedDOMComponentsWithTag(view, 'li');

      ReactDOM.findDOMNode(itemComponents[0]).click();
      setTimeout(function() {
        ReactDOM.findDOMNode(input).focus();

        setTimeout(function() {
          expect(mockEventHandler.called).not.to.be.ok();
          ReactDOM.findDOMNode(input).blur();

          setTimeout(function() {
            expect(mockEventHandler.calledOnce).to.be.ok();

            ReactDOM.findDOMNode(itemComponents[0]).click();

            setTimeout(function() {
              ReactDOM.findDOMNode(itemComponents[0]).blur();

              setTimeout(function() {
                expect(mockEventHandler.calledTwice).to.be.ok();
                done();
              }, 10);
            }, 10);
          }, 10);
        }, 10);
      }, 10);
    });
  });

  // describe("Future Features", function() {
  //   it('should allow multi-select (big new feature to implement)');
  //   it('should allow items to be re-arranged by drag-and-drop');
  //   it('should copy the item.toCopy value to the clipboard for any selected items when using system copy/paste shortcuts');
  //   it('should have some specific classNames on certain elements, maybe even the option to specify what they are');
  // });
});
