// require('./testdom')();
var React = require('react/addons');
var TestUtils = React.addons.TestUtils;
var sinon = require('sinon');
var expect = require('expect.js');
var Immutable = require('immutable');
var ImmutablePropTypes = require('react-immutable-proptypes');

// var COMPONENT = 'ItemBox';
var KEY_CODE_LEFT = 37
  , KEY_CODE_RIGHT = 39
  , KEY_CODE_DELETE = 48
  , KEY_CODE_BACKSPACE = 8
  , KEY_CODE_COMMA  = 188
  , KEY_CODE_TAB    = 9
  , KEY_CODE_ESCAPE = 27;

var TEST_TEMPLATE_CLASS = 'findme';
var TEST_TEMPLATE_SELECTED_CLASS = 'selected';
var TEST_TEMPLATE_DELETE_BUTTON_CLASS = 'deleteMe';
var TestTemplate = React.createClass({
  displayName: 'TestTemplate',
  propTypes: {
    data: ImmutablePropTypes.shape({
      text: React.PropTypes.string
    }),
    selected: React.PropTypes.bool,
    onRemove: React.PropTypes.func
  },
  render: function() {
    return (
      <div
        className={TEST_TEMPLATE_CLASS + (this.props.selected ? ' ' + TEST_TEMPLATE_SELECTED_CLASS : '')}
        style={{display: 'inline-block'}}
      >
        {this.props.data.get('text')}
        <span className={TEST_TEMPLATE_DELETE_BUTTON_CLASS} onClick={this.props.onRemove} />
      </div>
    );
  }
});

var _safeRenderCount = 0;
function safeRender(element) {
  var elem = document.createElement('div');
  elem.className = 'saferender test_' + _safeRenderCount++;
  document.body.appendChild(elem);
  return React.render(element, elem);
}

function getExpectedEntryWidth(viewComponent) {
  var viewWidth = viewComponent.getDOMNode().clientWidth;
  var itemWidth = 0;
  var itemComponents = TestUtils.scryRenderedDOMComponentsWithClass(viewComponent, TEST_TEMPLATE_CLASS);
  itemWidth = Math.ceil(itemComponents[itemComponents.length - 1].getDOMNode().getBoundingClientRect().right);
  var remainingWidth = viewWidth - itemWidth;
  return remainingWidth;
}

describe('ItemBox', function() {
  var TestComponent, sandbox, view, check, mockOnChange, mockInput, items, allowWarnings;
  var DEFAULT_ITEMS = Immutable.fromJS([
    { template: TestTemplate, data: { id: 1, text: 'aaa' } },
    { template: TestTemplate, data: { id: 2, text: 'bbb' } }
  ]);

  beforeEach(function() {
    TestComponent = require('../ItemBox');
    mockOnChange = sinon.spy();
    mockInput = function(e) { mockOnChange({ target: { value: e.target.value } }); };
    sandbox = sinon.sandbox.create();
    sandbox.stub(console, 'warn');
    items = DEFAULT_ITEMS;
    allowWarnings = false;
  });

  afterEach(function() {
    if(!allowWarnings) { sinon.assert.notCalled(console.warn); }
    sandbox.restore();
  });

  it('should have an input element containing the value prop', function() {
    var value = 'xyzzy';
    view = TestUtils.renderIntoDocument(<TestComponent value={value} onChange={mockOnChange} />);
    check = TestUtils.scryRenderedDOMComponentsWithTag(view, 'input');
    expect(check.length).to.be(1);
    expect(check[0].getDOMNode().value).to.be(value);
  });

  it('should call onChange when the user changes the entry value', function() {
    var value = 'xyzzy';
    view = TestUtils.renderIntoDocument(<TestComponent value={value} onChange={mockInput} />);
    check = TestUtils.scryRenderedDOMComponentsWithTag(view, 'input');

    TestUtils.Simulate.change(check[0], { target: { value: 'aaa' } });

    expect(check[0].getDOMNode().value).to.be(value);
    expect(mockOnChange.called).to.be.ok();
    expect(mockOnChange.args[0][0].target.value).to.be('aaa');
  });

  it('should render each item, in order, with the itemTemplate prop', function() {
    view = TestUtils.renderIntoDocument(<TestComponent value="" onChange={mockOnChange} items={items} />);
    check = TestUtils.scryRenderedDOMComponentsWithClass(view, TEST_TEMPLATE_CLASS);
    expect(check.length).to.be(2);
    for(var i = 0; i < check.length; i++) {
      expect(check[i].getDOMNode().textContent).to.be(items.getIn([i, 'data', 'text']));
    }
  });

  it('should render each item, in order, with a default itemTemplate', function() {
    allowWarnings = true;
    var itemsWithoutTemplates = Immutable.fromJS([
      { data: { id: 1, text: 'aaa' } },
      { data: { id: 2, text: 'bbb' } }
    ]);
    view = safeRender(<TestComponent value="" items={itemsWithoutTemplates} />);
    check = TestUtils.scryRenderedDOMComponentsWithClass(view, 'item');
    expect(check.length).to.be(2);
    sinon.assert.called(console.warn);
  });

  it('should put the entry point on the same line as the last item', function() {
    view = safeRender(<TestComponent value="" onChange={mockOnChange} items={items} />);
    check = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
    view.setProps({value: 'xyzzy', onChange: mockOnChange, items: items, itemTemplate: TestTemplate });
    var itemComponents = TestUtils.scryRenderedDOMComponentsWithTag(view, 'span');
    var expectedOffsetTop = itemComponents[0].getDOMNode().offsetTop;
    // this is a little bit fuzzy because some browsers offset the input differently
    // in practice, I have found that +/- 4 is pretty close without entering the wrong line territory
    expect(check.getDOMNode().offsetTop).to.be.within(expectedOffsetTop - 4, expectedOffsetTop + 4);
    expect(check.getDOMNode().style.width).not.to.be(0);
  });

  it('should move the entry point to the next line if the text string is too long for the remaining space', function() {
    var extraItems = Immutable.fromJS([
      { template: TestTemplate, data: { id: 1, text: 'aaa' } },
      { template: TestTemplate, data: { id: 2, text: 'bbb' } },
      { template: TestTemplate, data: { id: 2, text: 'ccc' } },
      { template: TestTemplate, data: { id: 2, text: 'ddd' } },
      { template: TestTemplate, data: { id: 2, text: 'eee' } }
    ]);
    view = safeRender(<TestComponent value="" onChange={mockOnChange} items={extraItems} />);
    var itemComponents = TestUtils.scryRenderedDOMComponentsWithTag(view, 'span');
    var wrapWidth = 0;
    for(var i = 0; i < itemComponents.length; i++) {
      wrapWidth += itemComponents[i].getDOMNode().offsetWidth;
    }
    view.getDOMNode().parentNode.style.width = '' + (wrapWidth + 80) + 'px';
    check = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
    view.setProps({value: 'xyzzyxyzzyxyzzyxyzzyxyzzy', onChange: mockOnChange, items: extraItems, itemTemplate: TestTemplate });
    expect(check.getDOMNode().offsetTop).to.be.greaterThan(itemComponents[0].getDOMNode().offsetTop);

    // the input should map to the full width of new line
    var fullWidth = view.getDOMNode().clientWidth;
    expect(check.getDOMNode().style.width).to.be(fullWidth + 'px');
  });

  it('should set the width of the text entry point to the remaining space in the box', function() {
    view = safeRender(<TestComponent value="" onChange={mockOnChange} items={items} />);
    var inputWidth = TestUtils.findRenderedDOMComponentWithTag(view, 'input').getDOMNode().style.width;
    expect(inputWidth).to.be(getExpectedEntryWidth(view) + 'px');
  });

  it('should resize the text entry point to respond to changing sizes', function(done) {
    view = safeRender(<TestComponent value="" onChange={mockOnChange} items={items} />);
    check = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
    var inputWidth = check.getDOMNode().style.width;
    view.getDOMNode().style.width = '500px';
    view.getDOMNode().style.border = '1px solid black';
    setTimeout(function() {
      inputWidth = check.getDOMNode().style.width;
      expect(inputWidth).to.be(getExpectedEntryWidth(view) + 'px');
      done();
    }, 50);
  });

  describe('item selection', function() {
    it('should not show any items as selected when the entry field has focus', function() {
      view = safeRender(<TestComponent value="" onChange={mockOnChange} items={items} />);
      check = TestUtils.scryRenderedDOMComponentsWithClass(view, TEST_TEMPLATE_SELECTED_CLASS);
      expect(check.length).to.be(0);
    });
    it('should mark an item as selected when clicked', function() {
      view = TestUtils.renderIntoDocument(<TestComponent items={items} />);
      check = TestUtils.scryRenderedDOMComponentsWithClass(view, TEST_TEMPLATE_CLASS);
      TestUtils.Simulate.click(check[0]);
      expect(check[0].getDOMNode().className).to.contain(TEST_TEMPLATE_SELECTED_CLASS);
    });
    it('should focus on the item when clicked', function() {
      view = safeRender(<TestComponent items={items} />);
      var itemComponents = TestUtils.scryRenderedDOMComponentsWithClass(view, TEST_TEMPLATE_CLASS);
      TestUtils.Simulate.click(itemComponents[0]);
      expect(itemComponents[0].getDOMNode().parentNode).to.be(document.activeElement);
    });
    it('should select none when the focus on an item blurs', function(done) {
      view = safeRender(<TestComponent items={items} />);
      check = TestUtils.scryRenderedDOMComponentsWithClass(view, TEST_TEMPLATE_CLASS);
      TestUtils.Simulate.click(check[1]);
      setTimeout(function() {
        TestUtils.Simulate.blur(check[1]);
        expect(TestUtils.scryRenderedDOMComponentsWithClass(view, TEST_TEMPLATE_SELECTED_CLASS).length).to.be(0);
        done();
      }, 50);
    });
    it('should mark the previous item as selected when hitting the left arrow', function() {
      view = safeRender(<TestComponent items={items} />);
      check = TestUtils.scryRenderedDOMComponentsWithClass(view, TEST_TEMPLATE_CLASS);
      TestUtils.Simulate.click(check[1]);
      TestUtils.Simulate.keyDown(check[1], { keyCode: KEY_CODE_LEFT });
      expect(check[0].getDOMNode().className).to.contain(TEST_TEMPLATE_SELECTED_CLASS);
      expect(check[1].getDOMNode().className).not.to.contain(TEST_TEMPLATE_SELECTED_CLASS);
    });
    it('should mark the next item as selected when hitting the right arrow', function() {
      view = safeRender(<TestComponent items={items} />);
      check = TestUtils.scryRenderedDOMComponentsWithClass(view, TEST_TEMPLATE_CLASS);
      TestUtils.Simulate.click(check[0]);
      TestUtils.Simulate.keyDown(check[0], { keyCode: KEY_CODE_RIGHT });
      expect(check[0].getDOMNode().className).not.to.contain(TEST_TEMPLATE_SELECTED_CLASS);
      expect(check[1].getDOMNode().className).to.contain(TEST_TEMPLATE_SELECTED_CLASS);
    });
    it('should select the last item when hitting the left arrow key from the left most position of the entry field', function() {
      view = safeRender(<TestComponent items={items} />);
      check = TestUtils.scryRenderedDOMComponentsWithClass(view, TEST_TEMPLATE_CLASS);
      var entry = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
      TestUtils.Simulate.click(entry);
      TestUtils.Simulate.keyDown(entry, { keyCode: KEY_CODE_LEFT });
      expect(check[items.size-1].getDOMNode().className).to.contain(TEST_TEMPLATE_SELECTED_CLASS);
    });
    it('should select the entry field when hitting the right arrow key from the last item', function() {
      view = safeRender(<TestComponent items={items} />);
      check = TestUtils.scryRenderedDOMComponentsWithClass(view, TEST_TEMPLATE_CLASS);
      TestUtils.Simulate.click(check[1]);
      TestUtils.Simulate.keyDown(check[1], { keyCode: KEY_CODE_RIGHT });
      expect(TestUtils.findRenderedDOMComponentWithTag(view, 'input').getDOMNode()).to.be(document.activeElement);
    });
  });

  describe('removing items', function() {
    it('should call onRemove with the selected item when hitting the delete keys', function() {
      view = safeRender(<TestComponent items={items} onRemove={mockOnChange} />);
      check = TestUtils.scryRenderedDOMComponentsWithClass(view, TEST_TEMPLATE_CLASS);
      TestUtils.Simulate.click(check[1]);
      expect(mockOnChange.called).not.to.be.ok();
      TestUtils.Simulate.keyDown(check[1], { keyCode: KEY_CODE_DELETE });
      expect(mockOnChange.called).not.to.be.ok();
      TestUtils.Simulate.keyUp(check[1], { keyCode: KEY_CODE_DELETE });
      expect(mockOnChange.called).to.be.ok();
      expect(mockOnChange.args[0][0]).to.be(1);
    });
    it('should call onRemove with the selected item when hitting the backspace keys', function() {
      view = safeRender(<TestComponent items={items} onRemove={mockOnChange} />);
      check = TestUtils.scryRenderedDOMComponentsWithClass(view, TEST_TEMPLATE_CLASS);
      TestUtils.Simulate.click(check[1]);
      expect(mockOnChange.called).not.to.be.ok();
      TestUtils.Simulate.keyDown(check[1], { keyCode: KEY_CODE_BACKSPACE });
      expect(mockOnChange.called).not.to.be.ok();
      TestUtils.Simulate.keyUp(check[1], { keyCode: KEY_CODE_BACKSPACE });
      expect(mockOnChange.called).to.be.ok();
      expect(mockOnChange.args[0][0]).to.be(1);
    });
    it('should call onRemove with the selected item when the item self reports a onRemove operation', function() {
      view = TestUtils.renderIntoDocument(<TestComponent items={items} onRemove={mockOnChange} />);
      check = TestUtils.scryRenderedDOMComponentsWithClass(view, TEST_TEMPLATE_DELETE_BUTTON_CLASS);
      TestUtils.Simulate.click(check[1]);
      expect(mockOnChange.called).to.be.ok();
      expect(mockOnChange.args[0][0]).to.be(1);
    });
  });

  describe('triggers', function() {
    var TRIGGER_KEYS    = [KEY_CODE_COMMA, KEY_CODE_TAB, KEY_CODE_ESCAPE];
    it('should call onTrigger with the trigger and the current text, including the trigger ' +
       'if updating the value based on the change, when the user types a trigger key', function() {
      var value = 'aaa';
      var cycleValue = function(e) {
        view.setProps({
          value: e.target.value,
          onChange: cycleValue,
          items: items,
          triggerKeys: TRIGGER_KEYS,
          onTrigger: mockOnChange
        });
      };
      view = TestUtils.renderIntoDocument(<TestComponent value={value} onChange={cycleValue} items={items} triggerKeys={TRIGGER_KEYS} onTrigger={mockOnChange} />);
      check = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
      TestUtils.Simulate.change(check, { target: { value: value + ',' } });
      TestUtils.Simulate.keyUp(check, { keyCode: KEY_CODE_COMMA });
      expect(mockOnChange.called).to.be.ok();
      expect(mockOnChange.args[0][0]).to.be(KEY_CODE_COMMA);
      expect(mockOnChange.args[0][1]).to.be(value + ',');
    });
    it('should call onTrigger with the trigger and the current text, not including the trigger ' +
       'if a character when the value is locked, when the user types a trigger key', function() {
      var value = 'aaa';
      view = TestUtils.renderIntoDocument(<TestComponent value={value} items={items} triggerKeys={TRIGGER_KEYS} onTrigger={mockOnChange} />);
      check = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
      TestUtils.Simulate.keyUp(check, { keyCode: KEY_CODE_COMMA });
      expect(mockOnChange.called).to.be.ok();
      expect(mockOnChange.args[0][0]).to.be(KEY_CODE_COMMA);
      expect(mockOnChange.args[0][1]).to.be(value);
    });
  });

  // it('should default the item template to a template that renders item.template(item) or toString if no template property is on the item');
  // describe("Future Features", function() {
  //   it('should allow multi-select (big new feature to implement)');
  //   it('should allow items to be re-arranged by drag-and-drop');
  //   it('should copy the item.toCopy value to the clipboard for any selected items when using system copy/paste shortcuts');
  //   it('should have some specific classNames on certain elements, maybe even the option to specify what they are');
  // });
});
