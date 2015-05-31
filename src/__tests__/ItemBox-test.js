var React = require('react/addons');
var TestUtils = React.addons.TestUtils;
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
const DEFAULT_ITEMS = Immutable.fromJS([
  { template: TestTemplate, data: { id: 1, text: 'aaa' } },
  { template: TestTemplate, data: { id: 2, text: 'bbb' } }
]);

var _safeRenderCount = 0;
function safeRender(element) {
  var elem = document.createElement('div');
  elem.className = 'saferender test_' + _safeRenderCount++;
  document.body.appendChild(elem);
  return React.render(element, elem);
}

function rerender(reactNode, component, newProps) {
  return (
    React.render(
      React.createElement(component, newProps),
      React.findDOMNode(reactNode).parentNode
    )
  );
}

function getExpectedEntryWidth(viewComponent) {
  var viewWidth = viewComponent.getDOMNode().clientWidth;
  var itemWidth = 0;
  var itemComponents = TestUtils.scryRenderedDOMComponentsWithClass(viewComponent, TestTemplate.templateClass);
  itemWidth = Math.ceil(React.findDOMNode(itemComponents[itemComponents.length - 1]).getBoundingClientRect().right);
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
    expect(React.findDOMNode(check[0]).value).to.be(value);
  });

  it('should call onChange when the user changes the entry value', function() {
    var value = 'xyzzy';
    var view = TestUtils.renderIntoDocument(<TestComponent value={value} onChange={mockInput} />);
    var check = TestUtils.scryRenderedDOMComponentsWithTag(view, 'input');

    TestUtils.Simulate.change(check[0], { target: { value: 'aaa' } });

    expect(React.findDOMNode(check[0]).value).to.be(value);
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
    expect(React.findDOMNode(check[0]).textContent).to.contain(itemsWithoutTemplates.getIn([0, 'data', 'text']));
  });

  it('should render each item, in order, with the itemTemplate prop', function() {
    var view = TestUtils.renderIntoDocument(<TestComponent value="" onChange={mockOnChange} items={items} />);
    var check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);
    expect(check.length).to.be(2);
    for(var i = 0; i < check.length; i++) {
      expect(React.findDOMNode(check[i]).textContent).to.be(items.getIn([i, 'data', 'text']));
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
    var expectedOffsetTop = React.findDOMNode(itemComponents[0]).offsetTop;

    // this is a little bit fuzzy because some browsers offset the input differently
    // in practice, I have found that +/- 4 is pretty close without entering the wrong line territory
    expect(React.findDOMNode(check).offsetTop).to.be.within(expectedOffsetTop - 4, expectedOffsetTop + 4);
    expect(React.findDOMNode(check).style.width).not.to.be(0);
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
      React.findDOMNode(itemComponents[itemComponents.length - 1]).getBoundingClientRect().right
    );
    React.findDOMNode(view).parentNode.style.width = '' + (wrapWidth + 80) + 'px';
    var check = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
    rerender(
      view,
      TestComponent,
      {value: 'xyzzyxyzzyxyzzyxyzzyxyzzy', onChange: mockOnChange, items: extraItems, itemTemplate: TestTemplate }
    );
    expect(React.findDOMNode(check).offsetTop).to.be.greaterThan(React.findDOMNode(itemComponents[0]).offsetTop + 4);

    // the input should map to the full width of new line
    var fullWidth = React.findDOMNode(view).clientWidth;
    expect(React.findDOMNode(check).style.width).to.be(fullWidth + 'px');
  });

  it('should set the width of the text entry point to the remaining space in the box', function() {
    var view = safeRender(<TestComponent value="" onChange={mockOnChange} items={items} />);
    var inputWidth = React.findDOMNode(TestUtils.findRenderedDOMComponentWithTag(view, 'input')).style.width;
    expect(inputWidth).to.be(getExpectedEntryWidth(view) + 'px');
  });

  it('should resize the text entry point to respond to changing sizes', function(done) {
    var view = safeRender(<TestComponent value="" onChange={mockOnChange} items={items} />);
    var check = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
    var inputWidth = React.findDOMNode(check).style.width;
    React.findDOMNode(view).style.width = '500px';
    setTimeout(function() {
      inputWidth = React.findDOMNode(check).style.width;
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
      expect(React.findDOMNode(check[0]).className).to.contain(TestTemplate.selectedClass);
    });
    it('should focus on the item when clicked', function() {
      var view = safeRender(<TestComponent items={items} />);
      var itemComponents = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);
      TestUtils.Simulate.click(itemComponents[0]);
      expect(React.findDOMNode(itemComponents[0]).parentNode).to.be(document.activeElement);
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
      expect(React.findDOMNode(check[0]).className).to.contain(TestTemplate.selectedClass);
      expect(React.findDOMNode(check[1]).className).not.to.contain(TestTemplate.selectedClass);
    });
    it('should mark the next item as selected when hitting the right arrow', function() {
      var view = safeRender(<TestComponent items={items} />);
      var check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);
      TestUtils.Simulate.click(check[0]);
      TestUtils.Simulate.keyDown(check[0], { keyCode: KEY_CODE_RIGHT });
      expect(React.findDOMNode(check[0]).className).not.to.contain(TestTemplate.selectedClass);
      expect(React.findDOMNode(check[1]).className).to.contain(TestTemplate.selectedClass);
    });
    it('should select the last item when hitting the left arrow key from the left most position of the entry field', function() {
      var view = safeRender(<TestComponent items={items} />);
      var check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);
      var entry = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
      TestUtils.Simulate.click(entry);
      TestUtils.Simulate.keyDown(entry, { keyCode: KEY_CODE_LEFT });
      var item = React.findDOMNode(check[items.size-1]);
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
      var inputNode = React.findDOMNode(TestUtils.findRenderedDOMComponentWithTag(view, 'input'));
      expect(inputNode).to.be(document.activeElement);
    });
  });

  // describe('removing items', function() {
  //   it('should call onRemove with the selected item when hitting the delete keys', function() {
  //     view = safeRender(<TestComponent items={items} onRemove={mockOnChange} />);
  //     check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);
  //     TestUtils.Simulate.click(check[1]);
  //     expect(mockOnChange.called).not.to.be.ok();
  //     TestUtils.Simulate.keyDown(check[1], { keyCode: KEY_CODE_DELETE });
  //     expect(mockOnChange.called).not.to.be.ok();
  //     TestUtils.Simulate.keyUp(check[1], { keyCode: KEY_CODE_DELETE });
  //     expect(mockOnChange.called).to.be.ok();
  //     expect(mockOnChange.args[0][0]).to.be(1);
  //   });
  //   it('should call onRemove with the selected item when hitting the backspace keys', function() {
  //     view = safeRender(<TestComponent items={items} onRemove={mockOnChange} />);
  //     check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);
  //     TestUtils.Simulate.click(check[1]);
  //     expect(mockOnChange.called).not.to.be.ok();
  //     TestUtils.Simulate.keyDown(check[1], { keyCode: KEY_CODE_BACKSPACE });
  //     expect(mockOnChange.called).not.to.be.ok();
  //     TestUtils.Simulate.keyUp(check[1], { keyCode: KEY_CODE_BACKSPACE });
  //     expect(mockOnChange.called).to.be.ok();
  //     expect(mockOnChange.args[0][0]).to.be(1);
  //   });
  //   it('should call onRemove with the selected item when the item self reports a onRemove operation', function() {
  //     view = TestUtils.renderIntoDocument(<TestComponent items={items} onRemove={mockOnChange} />);
  //     check = TestUtils.scryRenderedDOMComponentsWithClass(view, TEST_TEMPLATE_DELETE_BUTTON_CLASS);
  //     TestUtils.Simulate.click(check[1]);
  //     expect(mockOnChange.called).to.be.ok();
  //     expect(mockOnChange.args[0][0]).to.be(1);
  //   });
  // });

  // describe('triggers', function() {
  //   var TRIGGER_KEYS    = [KEY_CODE_COMMA, KEY_CODE_TAB, KEY_CODE_ESCAPE];
  //   it('should call onTrigger with the trigger and the current text, including the trigger ' +
  //      'if updating the value based on the change, when the user types a trigger key', function() {
  //     var value = 'aaa';
  //     var cycleValue = function(e) {
  //       view.setProps({
  //         value: e.target.value,
  //         onChange: cycleValue,
  //         items: items,
  //         triggerKeys: TRIGGER_KEYS,
  //         onTrigger: mockOnChange
  //       });
  //     };
  //     view = TestUtils.renderIntoDocument(<TestComponent value={value} onChange={cycleValue} items={items} triggerKeys={TRIGGER_KEYS} onTrigger={mockOnChange} />);
  //     check = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
  //     TestUtils.Simulate.change(check, { target: { value: value + ',' } });
  //     TestUtils.Simulate.keyUp(check, { keyCode: KEY_CODE_COMMA });
  //     expect(mockOnChange.called).to.be.ok();
  //     expect(mockOnChange.args[0][0]).to.be(KEY_CODE_COMMA);
  //     expect(mockOnChange.args[0][1]).to.be(value + ',');
  //   });
  //   it('should call onTrigger with the trigger and the current text, not including the trigger ' +
  //      'when the value is locked (no onChange callback), when the user types a trigger key', function() {
  //     var value = 'aaa';
  //     view = TestUtils.renderIntoDocument(<TestComponent value={value} items={items} triggerKeys={TRIGGER_KEYS} onTrigger={mockOnChange} />);
  //     check = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
  //     TestUtils.Simulate.keyUp(check, { keyCode: KEY_CODE_COMMA });
  //     expect(mockOnChange.called).to.be.ok();
  //     expect(mockOnChange.args[0][0]).to.be(KEY_CODE_COMMA);
  //     expect(mockOnChange.args[0][1]).to.be(value);
  //   });
  // });

  // // it('should default the item template to a template that renders item.template(item) or toString if no template property is on the item');
  // // describe("Future Features", function() {
  // //   it('should allow multi-select (big new feature to implement)');
  // //   it('should allow items to be re-arranged by drag-and-drop');
  // //   it('should copy the item.toCopy value to the clipboard for any selected items when using system copy/paste shortcuts');
  // //   it('should have some specific classNames on certain elements, maybe even the option to specify what they are');
  // // });
});
