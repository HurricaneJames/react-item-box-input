# Retrospective: Building and Packaging an Interactive React.js Component Part 2 - Of Items and Inputs

This is the second of a multi-part writeup on creating a React Item List Input component. The first part walked through my experiences setting up Karma with Mocha, Browserify, and Babel. This part will walk through the requirements and how to start writing tests/code to fulfill those requirements. The next part will discuss the interaction model of the component.

## Test Requirements for the Item Box

In the last article we asked the question, "what is an item list input." The general concept is the standard email "to" field. It has little badges, or tags, representing email addresses and an input field where more can be entered. The tags act like characters in the input field. They flow naturally, and the input starts where they end. It is possible to navigate using just the arrow keys on the keyboard.

So, when first presented with such a design I came up with the following basic requirements.

  - it should have an input element where the user can type
  - it should set the value of the input box to the 'value' prop
  - it should call onChange when when the user changes the value in the input box
  - it should render the input element on the same line as the last item
  - it should move the input element to the next line if the text string is too long for the current line
  - it should set the width of the input element to be the same length as the remaining space on the current line
  - it should resize the input element when the overall component is resized

Next, we want to consider the item list that is part of the component.

  - it should render each item in order (todo: add more detail about what render means)
  - it should render the ItemTemplate with a selected prop when marked as selected
  - it should not mark any item as selected when the input element has focus
  - it should mark an item as selected when clicking on an item
  - it should mark an item as selected  using the keyboard
  - it should call onRemove when hitting backspace/delete on a selected item
  - it should call onRemove when an item template triggers the onRemove prop

For good user experience we want to have intelligent interaction between the items and the input element.

  - it should mark the last item as selected when hitting the left arrow from the leftmost character in the entry input element
  - it should mark no items as selected when hitting the right arrow while the last item is selected
  - it should focus the input element when hitting the right arrow when the last item is selected


- input element events
    - should support onKeyUp
    - should support onKeyDown
    - should support onCopy
    - should support onCut
    - should support onPaste
    - should support onInputFocus
    - should support onInputBlur
- component level events
    - should support onFocus
    - should support onBlur

Finally, we want "trigger" keys that cause the component to call a callback prop. This is useful because there is no way to add items to the list (or remove them) from the component itself. The trigger key will allow the parent component to inspect interesting inputs (ex. comma, tab, enter, arrow keys, etc...) and perform an action such as adding an item to the list or navigating an auto-select popup.

  - it should call onTrigger with the trigger key and the current input element value

With these basic requirements in place we can start architecting our solution.

## Finally, Time to Start Writing Code!

We are going to start with `src/__tests__/ItemBox-test.js`. First thing we need to do is import some basic require's. Then we setup the main `describe` block. We will also create a basic `beforeEach` and `afterEach` function to setup a sinon.js sandbox.

    var React = require('react/addons');
    var TestUtils = React.addons.TestUtils;
    var sinon = require('sinon');
    var expect = require('expect.js');

    describe('ItemBox', function() {
      var TestComponent, sandbox, allowWarnings;
      beforeEach(function() {
        TestComponent = require('../ItemBox');
        sandbox = sinon.sandbox.create();
        sandbox.stub(console, 'warn');
        allowWarnings = false;
      });

      afterEach(function() {
        if(!allowWarnings) { sinon.assert.notCalled(console.warn); }
        sandbox.restore();
      });
    });

We configued the sinon.js sandbox to catch `console.warn` messages. I find it very helpful to fail a test if any `console.warn` messages were written. However, sometimes we want to see those messages, so we add a global `allowWarnings` flag. This setup helps us to catch bad propType definitions while our tests are running.

Using this skeleton, we can start writing our code. If you have read any of my previous articles, you know I like to start at the top of the list and work my way down. So, with that in mind, lets start with the input element requirements.

- it should have an input element where the user can type / it should set the value of the input box to the 'value' prop

    We are going to combine these two requirements into a single test.

        it('should have an input element containing the value prop', function() {
          var value = 'xyzzy';
          var view = TestUtils.renderIntoDocument(<TestComponent value={value} onChange={mockOnChange} />);
          var check = TestUtils.scryRenderedDOMComponentsWithTag(view, 'input');
          expect(check.length).to.be(1);
          expect(React.findDOMNode(check[0]).value).to.be(value);
        });

    In this test we create an `ItemBox` component with a simple value. The `mockOnChange` variable is used so frequently that we add `mockOnChange = sinon.spy();` to our `beforeEach` function.

    Since we are doing TDD, go ahead and run the tests. Yep, it fails. You should see something similar to:

        INFO [karma]: Karma v0.12.31 server started at http://localhost:9876/
        INFO [launcher]: Starting browser Firefox
        ERROR [framework.browserify]: bundle error
        ERROR [framework.browserify]: Error: Cannot find module '../ItemBox' from '/Users/HurricaneJames/Projects/react-item-box-input/src/__tests__'

    This tells us that there is no `ItemBox.js` file. So create one. Then, the simplest way to make the test pass is to add an input.

        var React = require('react');

        var ItemBox = React.createClass({
          displayName: 'ItemBox',
          propTypes: {
            value: React.PropTypes.string,
            onChange: React.PropTypes.func
          },
          render: function() {
            return (
              <div>
                <input type="text" value={this.props.value} onChange={this.props.onChange} />
              </div>
            );
          }
        });

        module.exports = ItemBox;

    Run `npm test` and everything works. Now, for those of you who are not new to TDD, I'm surprised you are reading this paragraph. That aside, I'm sure you are screaming, "Why the onChange param, that isn't part of your test?!?!?" Actually, it is. That little `afterEach` hook we added checks for any unexpected `console.warn` messages. React spits out a `console.warn` for input elements that have a value but no onChange or readOnly prop. If we run our test without the onChagne prop, we get an error.

        Firefox 37.0.0 (Mac OS X 10.10) ItemBox "after each" hook FAILED
          expected warn to not have been called but was called once
              warn(Warning: Failed propType: You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`. Check the render method of `ItemBox`.)

- it should call onChange when when the user changes the value in the input box
    
        it('should call onChange when the user changes the entry value', function() {
          var value = 'xyzzy';
          var view = TestUtils.renderIntoDocument(<TestComponent value={value} onChange={mockInput} />);
          var check = TestUtils.scryRenderedDOMComponentsWithTag(view, 'input');

          TestUtils.Simulate.change(check[0], { target: { value: 'aaa' } });

          expect(React.findDOMNode(check[0]).value).to.be(value);
          expect(mockOnChange.called).to.be.ok();
          expect(mockOnChange.args[0][0].target.value).to.be('aaa');
        });

    Here we test a simulated change event. Things to note, we have added a `mockInput` function as the onChange handler. mockInput is defined in beforeEach because it, like mockOnChange is used frequently.

        mockInput = function(e) { mockOnChange({ target: { value: e.target.value } }); };

    mockInput is fairly simple, it just calls the mockOnChange handler. However, it copies the important props in the process. We do this because sinon only copies the reference to the original params it is given and, unfortunately, the event properties are hard erased after the handler is called. So, when we call mockOnChange.args[0][0].target without using mockInput, the target and its value are undefined.

    Run the test, and... it passes? Yeah, we already wrote the code for this to make the last test pass. Oh well.

Normally, I would continue with the requirement list. However, the next requirement is to render the input element on the same line as the last item. This is not currently possible to test because we do not render any items. We could fake something, but that is likely to take more time than just skipping to the part about items.

- it should render each item in order / it should render the ItemTemplate with a selected prop when marked as selected

    Now that we are working on the items, we can think a little bit more about what it means to render an item in the list. I might be over-thinking this, but it seems to me that there are three scenarios. First, we pass in items with no templates, so we need a default template. Second, we pass in items with a global template, so we need an ItemBox level itemTemplate prop. Thirs, we pass in items that each specify their own template which takes precedence over any other template.

        it('should render each item, in order, with a default itemTemplate', function() {
          var itemsWithoutTemplates = Immutable.fromJS([
            { data: { id: 1, text: 'aaa' } },
            { data: { id: 2, text: 'bbb' } }
          ]);
          var view = safeRender(<TestComponent value="" items={itemsWithoutTemplates} />);
          var check = TestUtils.scryRenderedDOMComponentsWithClass(view, 'item');
          expect(check.length).to.be(2);
        });

    To even run this test we are going to need some more globals. First, `var Immutable = require('immutalbe');` to bring in [Immutable.js](http://facebook.github.io/immutable-js/). I'm a huge fan of Immutable.js, so our component is going to use it. You do not have to, but you should.

    We will also need to define the `safeRender` function.

        var _safeRenderCount = 0;
        function safeRender(element) {
          var elem = document.createElement('div');
          elem.className = 'saferender test_' + _safeRenderCount++;
          document.body.appendChild(elem);
          return React.render(element, elem);
        }

    `safeRender` gives us a unique document container for our test. Since we are testing against a real DOM, and it is not being reset after each test, this will help to keep our tests isolated.


    Run the test and watch it fail.

        Firefox 37.0.0 (Mac OS X 10.10) ItemBox should render each item, in order, with a default itemTemplate FAILED
        expected 0 to equal 2

    The implementation is fairly straight forward, we are going to add a new ItemList component and a DefaultTemplate component. But first we need to update ItemBox.js.

        var Immutable = require('immutable')
        var ImmutablePropTypes = require('react-immutable-proptypes')
        var ItemList = require('./ItemList')
        var DefaultTemplate = require('./DefaultTemplate');

        var ItemBox = React.createClass({
          propTypes: {
            // ...
            items: ImmutablePropTypes.list.isRequired
          },
          getDefaultProps: function() {
            return {
              items: new Immutable.List()
            };
          },
          render: function() {
            return (
              <div>
                <ItemList items={this.props.items} defaultTemplate={DefaultTemplate} />
                <input type="text" value={this.props.value} onChange={this.props.onChange} />
              </div>
            );
          }
        });

    We added `Immutable` and `react-immutable-proptypes`. React Immutable Proptypes is a small validation library that I wrote and open sourced. It allows validating against Immutable datastructures.

    We also added some default props, and empty Immutable.List for items. We need to guarantee that there is always an items data structure we can iterate over, even if it is empty. Finally, we added the new ItemList component to our div.

    The `ItemList` implementation is also fairly straightforward.

        var React = require('react')
          , ImmutablePropTypes = require('react-immutable-proptypes');

        var ItemList = React.createClass({
          displayName: 'ItemList',
          propTypes: {
            items: ImmutablePropTypes.listOf(ImmutablePropTypes.shape({
              data: React.PropTypes.any.isRequired
            })).isRequired,
            defaultTemplate: React.PropTypes.func.isRequired
          },
          renderItem: function(item) {
            return (
              <li key={item}>
                {
                  React.createElement(
                    this.props.defaultTemplate,
                    {
                      data: item.get('data')
                    }
                  )
                }
              </li>
            );
          },
          render: function() {
            var items = this.props.items.map(item => this.renderItem(item)).toArray();
            return (
              <ul>
                {
                  items
                }
              </ul>
            );
          }

        });

        module.exports = ItemList;

    Finally, we need to create our default template. As can be seen in the `propType` declaration, items requires a data property, which it will pass to the template.

        var React = require('react');

        const DEFAULT_TEMPLATE_CLASS = 'item';
        const DEFAULT_TEMPLATE_SELECTED_CLASS = 'selected';
        const DEFAULT_TEMPLATE_DELETE_BUTTON_CLASS = 'delete';

        var DefaultTemplate = React.createClass({
          displayName: 'DefaultTemplate',
          propTypes: {
            data: React.PropTypes.any.isRequired,
            selected: React.PropTypes.bool,
            onRemove: React.PropTypes.func
          },
          render: function() {
            return (
              <div
                className={
                  DEFAULT_TEMPLATE_CLASS +
                  (this.props.selected ? ' ' + DEFAULT_TEMPLATE_SELECTED_CLASS : '')
                }
                style={{display: 'inline-block'}}
              >
                {
                  this.props.data.toString()
                }
                <span
                  className={DEFAULT_TEMPLATE_DELETE_BUTTON_CLASS}
                  onClick={this.props.onRemove}
                >
                  {'X'}
                </span>
              </div>
            );
          }
        });

        module.exports = DefaultTemplate;

    The `DefaultTemplate` implements a lot of funcationality that we have not discussed yet. It is also pretty obvious that I did not start with tests. It could be said that "the author leaves the testing as an exercise for the reader." I would rather say that, as the default template, you get what you deserve and the author very specifically does not want to have any tests because they imply a contract. This is the default template, and it could change at any time, use it at your own peril.

    Some might be saying "wait, there were no tests for ItemList either..." `ItemList-test.js` is available in the repo. Its tests are largely duplicitative of the tests here. Due to the nature of the component, we are not really unit testing in the normal sense. So, if you care about the sub-component tests, look them up. The important tests for this areticle are the `ItemBox-test.js` tests because they describe the funcationality we are exporting.

    After running the tests again, we not have three passing tests. Lets go ahead and implement the next two types of rendering. 

        it('should render each item, in order, with the itemTemplate prop', function() {
          var view = TestUtils.renderIntoDocument(<TestComponent value="" onChange={mockOnChange} items={items} />);
          var check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);
          expect(check.length).to.be(2);
          for(var i = 0; i < check.length; i++) {
            expect(React.findDOMNode(check[i]).textContent).to.be(items.getIn([i, 'data', 'text']));
          }
        });

    We could define items local to this test, but as this then I would have to write a paragraph about extracting it for use in other tests since this is going to be our defacto item set for most tests. Instead, we are going to add some more globals and update our beforeEach hook.

        var TestTemplates = require('./ItemBox-TestTemplate')
          , TestTemplate = TestTemplates.default
          , TestTemplate2 = TestTemplates.alternate;

        const DEFAULT_ITEMS = Immutable.fromJS([
          { template: TestTemplate, data: { id: 1, text: 'aaa' } },
          { template: TestTemplate, data: { id: 2, text: 'bbb' } }
        ]);

        beforeEach(function() {
          // ...
          items = DEFAULT_ITEMS;
          // ...
        });

    As I said before, I'm a huge fan of Immutable.js. One of the benefits is that we can safely reassign `items = DEFAULT_ITEMS` and know that NOTHING has altered the original DEFAULT_ITEMS.

    We are also creating a new module, `ItemBox-TestTemplate`. We could create our template in our test. In fact, that is how it was originally implemented. However, it gets ugly fast, and we should really pull components into separate files in most cases. So, here we go:

        var React = require('react')
          , ImmutablePropTypes = require('react-immutable-proptypes');

        var TEST_TEMPLATE_CLASS = 'findme';
        var TEST_TEMPLATE_SELECTED_CLASS = 'selected';
        var TEST_TEMPLATE_DELETE_BUTTON_CLASS = 'deleteMe';

        function createTestTemplate(id) {
          id = id || '';
          var template = React.createClass({
            displayName: 'TestTemplate' + id,
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
                  className={TEST_TEMPLATE_CLASS + id + (this.props.selected ? ' ' + TEST_TEMPLATE_SELECTED_CLASS : '')}
                  style={{display: 'inline-block'}}
                >
                  {this.props.data.get('text')}
                  <span className={TEST_TEMPLATE_DELETE_BUTTON_CLASS} onClick={this.props.onRemove} />
                </div>
              );
            }
          });

          template.templateClass = TEST_TEMPLATE_CLASS + id;
          template.selectedClass = TEST_TEMPLATE_SELECTED_CLASS;
          template.deleteButtonClass = TEST_TEMPLATE_DELETE_BUTTON_CLASS;

          return template;
        }

        module.exports = {
          default: createTestTemplate(''),
          alternate: createTestTemplate('_2')
        };

    Again, there is some future functionality baked into the component to save time later. Most importantly, take note of our exports. This is not a normal module with a single export. Because this is a test component, we went ahead and created a component factory. We then use that to export two different templates. We are not bothing to write tests for the tests since this a test component.

    Note that we attach the className as `templateClass` which makes finding the element easier for our tests. We also take advantage of the data property, as opposed to using `toString`. Any real template should do this. 

    Now, run the test and watch the beautiful failure.

        Firefox 37.0.0 (Mac OS X 10.10) ItemBox should render each item, in order, with the itemTemplate prop FAILED
          expected 0 to equal 2

    We make it pass with a single, small change to `ItemList.js`. Change the `React.createElemtn` in `renderItem` to use the item defined template if available, and the defaultTemplate if not.

        React.createElement(
          // original
          // this.props.defaultTemplate,
          // new
          item.get('template') || this.props.defaultTemplate,

    Finally, we want to consider supplying our own default template instead of relying on the unstable `DefaultTemplate`.

        it('should accept a default template to use (itemTemplate) when the item does not specify its own template', function() {
          var itemsWithMixedTemplates = Immutable.fromJS([
            { data: { id: 1, text: 'aaa' }, template: TestTemplate },
            { data: { id: 2, text: 'bbb' } }
          ]);
          var view = safeRender(<TestComponent value="" items={itemsWithMixedTemplates} itemTemplate={TestTemplate2} />);
          expect(TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass).length).to.be(1);
          expect(TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate2.templateClass).length).to.be(1);
        });

    We create an item list with one item that uses TestTemplate and define a default `itemTemplate` that will be used for any items that do not specify their own. This lets us test that we can specify a default, and that it has lower priority than the item specified template. Note that we imported TestTemplate2 as part of the setup for the last test.

        Firefox 37.0.0 (Mac OS X 10.10) ItemBox should accept a default template to use (itemTemplate) when the item does not specify its own template FAILED
          expected 0 to equal 1

    Ah, sweet red starting line. The patch to make this test pass is only three lines in `ItemBox.js`.

        // first, add an itemTemplate propType
        itemTemplate: React.PropTypes.func.isRequired
        
        // second, specify a default prop for itemTemplate
        itemTemplate: DefaultTemplate

        // third, change the ItemList defaultTemplate prop to use the new default
        <ItemList items={this.props.items} defaultTemplate={this.props.itemTemplate} />

    We are back to green, and we have done our basic rendering. Now we get to the good part, testing DOM positions.

## Testing 2

- it should render the input element on the same line as the last item

    Up to this point, all our tests could have been done in Jest or Mocha using JSDOM. This will be our first test that completely bombs outside the presence of an actual layout engine.

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

    This test renders the TestComponent, then pulls the offsetTop of the first item and checks it against with offsetTop of the input element. We give a buffer of +/- 4 because different browsers will calculate the offsetTop of list items and input elements slightly differently.

    Run and get some nice failsauce.

        Firefox 37.0.0 (Mac OS X 10.10) ItemBox should put the entry point on the same line as the last item FAILED
          expected 254 to be within 196..204

    The fix is disturbingly simple. We need some style! Well, `ItemList` does anyway.

        const UL_STYLE = { listStyle: 'none', margin: 0, padding: 0, display: 'inline' };
        const LI_STYLE = { display: 'inline' };

        // renderItem
        <li key={item} style={LI_STYLE}>

        // render
        <ul style={UL_STYLE}>

    Those few changes will tell the browser to render the list without markers, margins, or padding. Most importantly, it also tells it to render the list inline, so the input element will be on the same line. We also need to render the 'li' elements inline or they will stack vertically.

- it should move the input element to the next line if the text string is too long for the current line

    Next, we need to make sure that the user gets a new, full width line if they write too much for the current line. This makes for a nice, big, beefy test.

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

          // shrink the component to the point a wrap is guaranteed (80px beyond the last item)
          React.findDOMNode(view).parentNode.style.width = '' + (wrapWidth + 80) + 'px';

          var input = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
          rerender(
            view,
            TestComponent,
            {
              value: 'xyzzyxyzzyxyzzyxyzzyxyzzy',
              onChange: mockOnChange,
              items: extraItems,
              itemTemplate: TestTemplate
            }
          );
          expect(React.findDOMNode(input).offsetTop).to.be.greaterThan(
            React.findDOMNode(itemComponents[0]).offsetTop + 4
          );

          // the input should map to the full width of new line
          var fullWidth = React.findDOMNode(view).clientWidth;
          expect(React.findDOMNode(input).style.width).to.be(fullWidth + 'px');
        });

    First, we define a bunch of items that are will get our input close to the available space. We safeRender those as normal. Then, we calculate how wide they are and set the parentNode width to be 80px wider. We rerender with some text that should be more than 80px wide. Then, we check that the input element offsetTop is well beneath the last item and that its width is the full parent width.

    To do all of this we introduced a new global function, `rerender`. This is a little helper that we can use to rerender our component with new props. With React 0.13, both `setProps` and `getDOMNode` were deprecated. Now we use `React.findDOMNode` and `React.render` instead. Since this requires substantially more boilerplate, I created this little helper. In my larger projects, I have this in a helpers module that I import for all of my tests.

        function rerender(reactNode, component, newProps) {
          return (
            React.render(
              React.createElement(component, newProps),
              React.findDOMNode(reactNode).parentNode
            )
          );
        }

    Now, run the test.

        Firefox 37.0.0 (Mac OS X 10.10) ItemBox should move the entry point to the next line if the text string is too long for the remaining space FAILED
          expected 73 to be above 80
    
    Not only is this a big, beefy test. It requires quite a bit of heavy lifting in the components as well.

    First, we need to update ItemBox.js with some handlers for component update/mount. That way we can monitor when the component changes and recalculate the size of the input element.

        componentDidMount: function() {
          this.resizeEntryWidth(this.props.value);
        },
        componentDidUpdate: function() {
          this.resizeEntryWidth(this.props.value);
        },

    `resizeEntryWidth` will calculate the new witdh and call setState.

        resizeEntryWidth: function(entryText) {
          var newWidth = this.getCorrectEntryWidth(entryText);
          if(newWidth !== this.state.width) {
            this.setState({ width: newWidth });
          }
        },

    `getCorrectEntryWidth` does the heavy lifting of figuring out how big the input element should be based on how big everything else is.

        getCorrectEntryWidth: function(entryText) {
          var node = React.findDOMNode(this.refs['entry']);
          var entryOffset = (this.state.lastItemRightBoundary > 0 ? this.state.lastItemRightBoundary : node.offsetLeft) || 0;
          var maxWidth = node.parentNode.clientWidth || this.props.defaultWidth;
          var textWidth = this.getTextWidth(entryText) || 0;
          return (textWidth + entryOffset > maxWidth) ? maxWidth : maxWidth - entryOffset;
        },
    `getCorrectEntryWidth` relies on one state, `lastItemRightBoundary`, and another function to calculate the width of the text in the input.

        getTextWidth: function(text) {
          var node = React.findDOMNode(this.refs['testarea']);
          node.innerHTML = text;
          return node.offsetWidth;
        },

    To make all this work, we need to update the ItemBox render method with some refs, a new test area div, and a callback to get the right boundary point from the ItemList. Rather than show the diff, I'm going to take a page out of the React playbook and just rewrite the whole render function.

        render: function() {
          var inputStyle = {
            display: 'inline-block',
            width: this.state.width
          };
          return (
            <div>
              <div ref="testarea" className="testarea" style={TEST_AREA_STYLE} />
              <ItemList ref="itemList" items={this.props.items} defaultTemplate={this.props.itemTemplate} onLastItemRightBoundaryChange={this.updateRightBoundary} />
              <input ref="entry" type="text" value={this.props.value} onChange={this.props.onChange} style={inputStyle} />
            </div>
          );
        }

    There are several things to pay attention to here. First, we have used the special `ref` prop on the test area div and the input element. Second, we added the `onLastItemRightBoundaryChange` callback to the ItemList component. Third, we have added a style prop to the input and test are components.

    The test area uses a fixed style to keep it hidden away.

        const TEST_AREA_STYLE = {
          position: 'absolute',
          visibility: 'hidden',
          height: 'auto',
          width: 'auto',
          whiteSpace: 'nowrap'
        };

    The input style is calculated based on the newly calculated width. Because we are using a state value, we need to add it to our initial state. We need to do the same thing with `lastItemRightBoundary`, which we use in `getCorrectEntryWidth`.

        getInitialState: function() {
          return {
            width: '1em',
            lastItemRightBoundary: 0
          };
        },

    We also need to handle the `onLastItemRightBoundaryChange` callback.

        updateRightBoundary: function(newRightBoundary) {
          if(this.state.lastItemRightBoundary !== newRightBoundary) {
            this.setState({lastItemRightBoundary: newRightBoundary});
          }
        },

    This is fairly simple, but has a gotacha. This callback will be called from the ItemList's `componentDidUpdate` callback. If we just setState here, it could cause the Child component to update again. Causing an infinite recursion. Therefore, we check to see if the value has changed before setting it. Alternatively, we could use `shouldComponentUpdate` to prevent updating the component if the state did not change.

    Earlier we setup eslint. If you are using it, then you should notice several errors at this point. Setting state in componentDidMount or componentDidUpdate is generally a bad thing. It can lead to infinite loops. Generally, you are much better just running calculations in the render function.

    **Tip: If you run your tests and get a really long stack trace or a message about too much recursions, it is probably because you are calling setState from componentDidUpdate. Be very careful to only update the state if it actually changed. Otherwise, React is prefectly happy to update and call componetDidUpdate again.**

    However, our calculations require finding actual DOM nodes and running calculations based on those nodes. React has very strong opinions about calling findDOMNode or getDOMNode inside the render function. It expresses these opinions with a loud console.warn.

    Therefore, we are stuck putting our updates in the componentDidMount and componentDidUpdate functions. On the bright side, this means that we are guaranteed that the component is mounted in the DOM, so we do not need to do a lot of checks to see if stuff is mounted. On the down side, eslint is going to complain non-stop. Unless we disable the update checks for this module!

    Disabling eslint features per file is easy. Simply add a comment at the top of the file with `eslint-disable` and the features we want to disable.

        /*eslint-disable react/no-did-mount-set-state, react/no-did-update-set-state, dot-notation */

    Here we are disabling the two troublesome update checks, along with the dot-notation check. We disable the dot-notation because we want to access refs using string notation (ex. `this.refs['entry']`). We want to use string notation to maintain "Google Closure Compiler Crushing resilience" (see the Summary cautions section of "[More About Refs](http://facebook.github.io/react/docs/more-about-refs.html#cautions)").

    Alright, run the tests again, and we have green.

- it should set the width of the input element to be the same length as the remaining space on the current line

    After the last test, this one should be fairly simple. We already know that the last test checked that the width was correct when the component was pushed down to its own line. 

        it('should set the width of the text entry point to the remaining space in the box', function() {
          var view = safeRender(<TestComponent value="" onChange={mockOnChange} items={items} />);
          var inputWidth = React.findTestUtils.findRenderedDOMComponentWithTag(view, 'input').getDOMNode().style.width;
          expect(inputWidth).to.be(getExpectedEntryWidth(view) + 'px');
        });

    Render, grab the element, pull out the real DOM node, grab the style width, and verify. To make this work, we need to know what the expected width should be. This, however, is difficult because every browser is doing to render it slightly differently. Our solution is to calculate the width much the way we did do in the component.

        function getExpectedEntryWidth(viewComponent) {
          var viewWidth = viewComponent.getDOMNode().clientWidth;
          var itemWidth = 0;
          var itemComponents = TestUtils.scryRenderedDOMComponentsWithClass(viewComponent, TestTemplate.templateClass);
          itemWidth = Math.ceil(React.findDOMNode(itemComponents[itemComponents.length - 1]).getBoundingClientRect().right);
          var remainingWidth = viewWidth - itemWidth;
          return remainingWidth;
        }

    At first I questioned the value of duplicating the internal calculation here instead of using a known, fixed point. However, it works across all test browsers and worked through refactoring how the elements were rendered (array of spans vs ul/li).

    Run our tests, and it looks like we already covered this case.

- it should resize the input element when the overall component is resized

    I'll admit, I did not think of this case initially. This was a bug I found while using the component. However, it was so obvious in retrospect that I try to think of "what would resizing do" for all of my components now.

        it('should resize the text entry point to respond to changing sizes', function(done) {
          var view = safeRender(<TestComponent value="" onChange={mockOnChange} items={items} />);
          var check = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
          var inputWidth = React.findDOMNode(check).style.width;

          // resize
          React.findDOMNode(view).style.width = '500px';

          setTimeout(function() {
            inputWidth = React.findDOMNode(check).style.width;
            expect(inputWidth).to.be(getExpectedEntryWidth(view) + 'px');
            done();
          }, 50);
        });

    Most of this test we have talked about previously. However, notice that the it function takes a `done` param. Sometimes a test requires time after the functions run to complete. Mocha handles this with a done param. We can then call a timeout to wait for the test to complete and call `done()` to let Mocha know the test is done executing. If we forget to call done, Mocha will wait for a while and eventually fail the test for never completing.

    React is fast, however it will not handle the resize and all the callbacks 





stuff here
stuff here
stuff here
stuff here







    Making this test requires some means of detecting a resize event. Unfortunately, HTML is extremely deficient in resize detection on anything other than a window. That means we have to use an old trick of embedding an iframe and listening to that elements window event.

        // src/ResizeDetector.js
        var React = require('react');

        var RESIZE_FRAME_STYLE = {
          position: 'absolute',
          visibility: 'hidden',
          height: '100%',
          width: '100%'
        };

        var ResizeDetector = React.createClass({
          displayName: 'ResizeDetector',
          propTypes: {
            onResize: React.PropTypes.func.isRequired
          },
          componentDidMount: function() {
            var document = this.refs.iframe.getDOMNode().contentDocument;
            document && (document.defaultView || document.parentWindow).addEventListener('resize', this.handleResize);
          },
          componentWillUnmount: function() {
            var document = this.refs.iframe.getDOMNode().contentDocument;
            document && (document.defaultView || document.parentWindow).removeEventListener('resize', this.handleResize);
          },
          handleResize: function() {
            this.props.onResize();
          },
          render: function() {
            return <iframe ref='iframe' style={RESIZE_FRAME_STYLE} />;
          }
        });

        module.exports = ResizeDetector;

    The ResizeDetector component adds a resize event listener to the iframe window in componentDidMount. We then remove that listener when the component is unmounted. Again, we use the hidden element trick, but we ignore the top/left position and add width/height to 100% so the iframe will scale with the parent component. Whenever the resize event comes through, we call the onResize callback prop.

    Now that we have a way to detect resizes on a single component, we will add that ability to our ItemBox.

        var ResizeDetector = require('./ResizeDetector')

        var ItemBox = React.createClass({
          // ...
          onResize: function() {
            this.resizeEntryWidth(this.props.value);
          },
          render: function() {
            // ...
                <ResizeDetector onResize={this.onResize} />
            // ...

    Again we take advantage of the `resizeEntryWidth` function to handle the heavy lifting.

    Run our test and all green.


## Issues

- lettings others test mocha libraries, or why isomorphic is important

## Setting up Code Metrics
- travis
- istanbul
- code climate
- badges











