### Item Selection

The previous parts of this walkthrough looked at rendering items and dynamically resizing the width of the input element. This section will look at item selection. There are two ways we can look at item selection. First, we could control the selection the way we do input text. Second, we can allow the component to handle all aspects of item selection. We are going to go with the second option in the same way that the input component does not control what text the user selects, only what text is in the element.

- it should not mark any item as selected when the input element has focus

    Since our items selection model is based on selection and focus, it makes sense that only one thing can have input focus at a time.

        it('should not show any items as selected when the entry field has focus', function() {
          var view = safeRender(<TestComponent value="" onChange={mockOnChange} items={items} />);
          var check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.selectedClass);
          expect(check.length).to.be(0);
        });

    We rely on TestTemplate.selectedClass being present because it was part of the original template generator described in the last section.

    When we run this test it passes because we have no selection defined at all. Really, this test is just to guarantee that ground truth as we start tinkering on the next few requirements.

- it should mark an item as selected when clicking on an item

    This requirement will actually require a couple tests. First, we just check that the item is marked as selected.

        it('should mark an item as selected when clicked', function() {
          var view = TestUtils.renderIntoDocument(<TestComponent items={items} />);
          var check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);
          TestUtils.Simulate.click(check[0]);
          expect(check[0].getDOMNode().className).to.contain(TestTemplate.selectedClass);
        });

    Now we have a test that fails.

        Firefox 37.0.0 (Mac OS X 10.10) ItemBox item selection should mark an item as selected when clicked FAILED
          expected 'findme' to contain 'selected'

    We will add some state and a click callback handler to the ItemList to make this pass. Alternatively, we could use props and moved this state up into the ItemBox. However, I decided against that approach because it adds considerable complexity with no real benefit.

        getInitialState: function() {
          return {
            selected: NONE_SELECTED
          };
        },
        selectItem: function(index) {
          if(this.state.selected !== index) {
            this.setState({ selected: index });
          }
        },
        onItemClick: function(index, e) {
          e.preventDefault();
          e.stopPropagation();
          this.selectItem(index);
        },

    We will also pull out the part where we render the template into it's own function. This will keep our code cleaner and easier to read.

        renderTemplate: function(item, index) {
          return (
            React.createElement(
              item.get('template') || this.props.defaultTemplate,
              {
                data: item.get('data'),
                selected: this.state.selected === index
              }
            )
          );
        },

    Finally, we rewrite the renderItem function to use the new renderTemplate function and add a listener for clicks on items.

        renderItem: function(item, index) {
          return (
            <li
              key={item}
              ref={'item' + index}
              style={LI_STYLE}
              onClick={this.onItemClick.bind(null, index)}
            >
              {
                this.renderTemplate(item, index)
              }
            </li>
          );
        },

    Note that we bind `onItemClick` with the index. This provides a convenient way of knowing which items was clicked. Oh, and do not forget the `NONE_SELECTED` const.

        const NONE_SELECTED = -1;

    Run the tests and we are all green.

    Now that we know clicking on the item selects it, we should test that selected items have keyboard focus. This will give the the illusion of a single text area like element. We can test this by checking if the selected item is the `document.activeElement`.

        it('should focus on the item when clicked', function() {
          var view = safeRender(<TestComponent items={items} />);
          var itemComponents = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);
          TestUtils.Simulate.click(itemComponents[0]);
          expect(React.findDOMNode(itemComponents[0]).parentNode).to.be(document.activeElement);
        });

    The solution to make this test pass has three parts.

    First, we update the `selectItem` function with a second if clause.

      selectItem: function(index) {
        if(this.state.selected !== index) {
          this.setState({ selected: index });
        }
        if(index !== NONE_SELECTED && index < this.props.items.size) {
          this.focus(this.refs['item' + index]);
        }
      },

    Next, we add a focus function.

        focus: function(element) {
          if(element) { React.findDOMNode(element).focus(); }
        },

    Finally, we need to add `tabIndex="0"` to our li items in `renderItem`. Adding tabIndex enables elements that normally cannot receive keyboard focus to receive focus. Setting it to 0 tells the browser not to mess with the natural order.

    And we are back to green.

    Finally, we want to make sure that an item is not marked as selected when losing keyboard focus. We do this because item selection only matters while the user is in the item list.

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

    To make this test pass we will add an onBlur handler to the li's.

        onItemBlur: function() {
          this.selectItem(NONE_SELECTED);
        },

- it should mark an item as selected using the keyboard

    Keyboard event handling in JavaScript is complicated, and way beyond the scope of this walkthrough. Although a bit dated, Jan Wolter wrote the definitive [guide](http://unixpapa.com/js/key.html). React helps a lot by normalizing the keyboard event across browsers the way jQuery did. So, for our work, we really only need four keycodes.

        // src/KeyCodes.js
        const KEY_CODE_LEFT = 37;
        const KEY_CODE_RIGHT = 39;
        const KEY_CODE_DELETE = 48;
        const KEY_CODE_BACKSPACE = 8;

        module.exports = {
          LEFT_ARROW: KEY_CODE_LEFT,
          RIGHT_ARROW: KEY_CODE_RIGHT,
          DELETE: KEY_CODE_DELETE,
          BACKSPACE: KEY_CODE_BACKSPACE
        };

    For selection we need to consider hitting the left/right arrow keys.

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


    Nothing new or exciting here, just more red to turn green.

    First, we need to set a keyboard event listener on the 'ul' component in our ItemList render function. For left/right arrow we will use 'keyDown' do we get repeats.

        <ul style={UL_STYLE} onKeyDown={this.onKeyDown}>

    onKeyDown will switch on the keyCode.

        onKeyDown: function(e) {
          switch(e.keyCode) {
            case KeyCodes.LEFT_ARROW:
              this.selectPrevious();
              break;
            case KeyCodes.RIGHT_ARROW:
              this.selectNext();
              break;
          }
        },

    We create separate functions for selecting next/previous for readability.

        selectPrevious: function() {
          if(this.state.selected !== NONE_SELECTED) { this.selectItem(this.state.selected - 1); }
        },
        selectNext: function() {
          if(this.state.selected <= this.props.items.size) { this.selectItem(this.state.selected + 1); }
        },

    The only check we do is to prevent the selected index getting more than one increment outside the size of our items. If we did not do this, then we could accidently queue up a bunch of left arrows and the next right arrow would not select the first item as expected.

    All green! However, before we continue, we should consider the requirement when hitting the left arrow on the first item. It was never defined, and our current implementation will eave the first item focused, but not selected. This may be the desired behavior for some applications, but it looks weird to me. So I'm going to add this completely optional requirement/test.

        it('should keep the first item selected when hitting the left arrow on the first item', function() {
          var view = safeRender(<TestComponent items={items} />);
          var check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);
          TestUtils.Simulate.click(check[0]);
          TestUtils.Simulate.keyDown(check[0], { keyCode: KEY_CODE_LEFT });
          expect(React.findDOMNode(check[0]).className).to.contain(TestTemplate.selectedClass);
          expect(React.findDOMNode(check[0]).parentNode).to.be(document.activeElement);
        });

    This tests that hitting the left arrow on the first item does nothing, it leaves the item selected and focused. The fix is as simple as updating the selectPrevious method.

        selectPrevious: function() {
          if(this.state.selected > 0) { this.selectItem(this.state.selected - 1); }
        },

    Now select previous will only decrement if it is on an item above the first item.

    Run the test and all green. Next we need to consider the interaction between the input and the items.

- it should mark the last item as selected when hitting the left arrow from the leftmost character in the entry input element

        it('should select the last item when hitting the left arrow key from the left most position of the entry field', function() {
          var view = safeRender(<TestComponent items={items} />);
          var check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);
          var entry = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
          TestUtils.Simulate.click(entry);
          TestUtils.Simulate.keyDown(entry, { keyCode: KEY_CODE_LEFT });
          expect(React.findDOMNode(check[items.size-1]).className).to.contain(TestTemplate.selectedClass);
        });

    This is a slightly tricky thing to pull off because we pushed the item list into a separate component. There are a number of ways to do it, but the easiest and cleanest method is to follow the advice of the [Benefits](https://facebook.github.io/react/docs/more-about-refs.html#benefits) section of the "More About Refs" guide on reactjs.com.

    We will call a `selectLast` method in the ItemList component from the ItemBox when hitting the left arrow from the left most position of the input. First, need to add a keyboard event handler prop to the input component. Then we need to add a ref to the list so we can find it from that handler.

        <ItemList ref="itemList" {...otherProps} />
        <input onKeyDown={this.onEntryKeyDown} {...otherProps} />

    We use onKeyDown because it allows for repeats.

        onEntryKeyDown: function(e) {
          e.stopPropagation();
          if(e.keyCode === KeyCodes.LEFT_ARROW) {
            var position = this.getCaretPosition(e.target);
            if(position === 0) {
              this.refs['itemList'].selectLast();
            }
          }
        },

    When we get a LEFT_ARROW key code, we tell the itemList to select the last item if the caret position is already 0. KeyDown fires before the caret moves, so if it is zero, then we know it was at the head of the input before the key was pressed. Capturing the position is tricky, but possible.

        getCaretPosition: function (inputElement) {
          if('selectionStart' in inputElement) {
            return inputElement.selectionStart;
          }else {
            var selection = document.selection.createRange();
            var selectionLength = selection.text.length;
            selection.moveStart('character', -inputElement.value.length);
            return selection.text.length - selectionLength;
          }
        },

    In modern browsers, we just check if 'selectionStart' is part of the element. However, older browsers, especially IE, need some massaging to get the position. For those browsers, we need to create a selection range, move the selection to the start of the input, then calculate how many characters are selected.

    Finally, we need to add the `selectLast` method to the ItemList module.

        selectLast: function() {
          this.selectItem(this.props.items.size - 1);
        },

    Run our tests, and back to green.

- it should mark no items as selected when hitting the right arrow while the last item is selected

      it('should mark no items as selected when hitting the right arrow while the last item is selected', function() {
        var view = safeRender(<TestComponent items={items} />);
        var check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);
        TestUtils.Simulate.click(check[1]);
        TestUtils.Simulate.keyDown(check[1], { keyCode: KEY_CODE_RIGHT });
        check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.selectedClass);
        expect(check.length).to.be(0);
      });

    This test already passes. However, it is important that it keeps passing as we work to make the next test green. 

- it should focus the input element when hitting the right arrow when the last item is selected

    This is easier than the case where the left arrow needed to select the last item. This implementation can use a callback from the ItemList. But first the test.

        it('should select the entry field when hitting the right arrow key from the last item', function() {
          var view = safeRender(<TestComponent items={items} />);
          var check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);
          TestUtils.Simulate.click(check[1]);
          TestUtils.Simulate.keyDown(check[1], { keyCode: KEY_CODE_RIGHT });
          var inputNode = React.findDOMNode(TestUtils.findRenderedDOMComponentWithTag(view, 'input'));
          expect(inputNode).to.be(document.activeElement);
        });

    First, add the callback to the propTypes for ItemList.js.

        onSelectNextField: React.PropTypes.func

    Next, update the selectItem function in ItemList.js to call onSelectNextField if the index exists and is greater than the number of items in the list.

        selectItem: function(index) {
          if(this.state.selected !== index) {
            this.setState({ selected: index });
          }
          if(index !== NONE_SELECTED) {
            if(index < this.props.items.size) {
              this.focus(this.refs['item' + index]);
            }else if(this.props.onSelectNextField) {
              this.props.onSelectNextField();
            }
          }
        },

    Then, update the JSX for the ItemList to include the new callback prop in the ItemBox.js module.

        <ItemList {...otherProps} onSelectNextField={this.onItemSelectNextField} />

    Finally, add a `onItemSelectNextField` method to the ItemBox module.

        onItemSelectNextField: function() {
          var entry = this.refs['entry'];
          if(entry) { React.findDOMNode(entry).focus(); }
        },

    Run the tests. All green.

    We can now start thinking about removing items from the list.

- it should call onRemove when hitting backspace/delete on a selected item

    Unlike the arrow events, we are only going to pay attention to the delete/backspace events on keyUp. This is a design decision to make sure that we do not rapid delete items by mistake. If you want that behavior, it is easy enough to get.

    There is a lot of stuff in these two tests, but it is all pretty obvious as to what it does. Basically, we want to make sure that nothing happens on keyDown, but that on keyUp the onRemove callback is triggered.

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
        it('should call onRemove with the selected item when hitting the backspace keys', function() {
          var view = safeRender(<TestComponent items={items} onRemove={mockOnChange} />);
          var check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);
          TestUtils.Simulate.click(check[1]);
          expect(mockOnChange.called).not.to.be.ok();
          TestUtils.Simulate.keyDown(check[1], { keyCode: KEY_CODE_BACKSPACE });
          expect(mockOnChange.called).not.to.be.ok();
          TestUtils.Simulate.keyUp(check[1], { keyCode: KEY_CODE_BACKSPACE });
          expect(mockOnChange.called).to.be.ok();
          expect(mockOnChange.args[0][0]).to.be(1);
        });

    Despite how ugly the tests looks, the implemention is actually fairly clean and simple. First, ItemBox needs to accept an onRemove prop and forward the onRemove events from ItemList to that prop.

        propTypes: {
          // ...
          onRemove: React.PropTypes.func
        }

        // render
        <ItemList {...otherProps} onRemove={this.props.onRemove} />

    ItemList will add an onKeyUp handler and attach that to a prop on the ul component.

        propTypes: {
          // ...
          onRemove: React.PropTypes.func
        }

        onKeyUp: function(e) {
          switch(e.keyCode) {
            case KeyCodes.DELETE:
            case KeyCodes.BACKSPACE:
              if(this.props.onRemove && this.state.selected > -1 && this.state.selected < this.props.items.size) {
                this.props.onRemove(this.state.selected);
              }
              break;
          }
        },

        // render
        <ul {...otherProps} onKeyUp={this.onKeyUp} />

    The event handler checks the keycode and whether anything is selected. If those conditions are met, it will fire onRemove.

    Run the test. All green.

- it should call onRemove when an item template triggers the onRemove prop

        it('should call onRemove with the selected item when the item self reports a onRemove operation', function() {
          var view = TestUtils.renderIntoDocument(<TestComponent items={items} onRemove={mockOnChange} />);
          var check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.deleteButtonClass);
          TestUtils.Simulate.click(check[1]);
          expect(mockOnChange.called).to.be.ok();
          expect(mockOnChange.args[0][0]).to.be(1);
        });

    Another easy test to make pass. Just add a listener for the onRemove event from the template.

        onRemoveItem: function(index) {
          if(this.props.onRemove) { this.props.onRemove(index); }
        },
        renderTemplate: function(item, index) {
          return (
            React.createElement(
              item.get('template') || this.props.defaultTemplate,
              {
                data: item.get('data'),
                selected: this.state.selected === index,
                onRemove: this.onRemoveItem.bind(null, index)
              }
            )
          );
        },

    The only tricky part is remembering to bind the current index value to make it easy to call the onRemove prop.

- it should select the last item when hitting backspace from the leftmost position of the input element

    After finishing these requirement, it seems like it would be nice if hitting backspace from the first character position of the input element would do the same thing as the left arrow. We can implement that fairly easily.

        it('should select the last item when hitting the backspace key from the first position of the entry field', function() {
          var view = safeRender(<TestComponent items={items} />);
          var check = TestUtils.scryRenderedDOMComponentsWithClass(view, TestTemplate.templateClass);
          var entry = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
          TestUtils.Simulate.click(entry);
          TestUtils.Simulate.keyUp(entry, { keyCode: KEY_CODE_BACKSPACE });
          var item = React.findDOMNode(check[items.size-1]);
          expect(item.className).to.contain(TestTemplate.selectedClass);
          expect(item.parentNode).to.be(document.activeElement);
        });

    
- it should be able to move through the items with ease

    While playing with some examples, we found a bug. When hitting the arrow keys more than once, the item list broke. It was a bug that came about because we were bluring/focusing items, and trying to keep that in sync with various set states and React renders. The solution is not difficult, but the test is ugle.

        it.only('should be able to move through all of the items with no problems', function() {
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
          expect(React.findDOMNode(check[selectedItem-1]).className).to.contain(TestTemplate.selectedClass);
          expect(React.findDOMNode(check[selectedItem]).className).not.to.contain(TestTemplate.selectedClass);

          selectedItem = selectedItem - 1;
          TestUtils.Simulate.keyDown(check[selectedItem], { keyCode: KEY_CODE_LEFT });
          expect(React.findDOMNode(check[selectedItem-1]).className).to.contain(TestTemplate.selectedClass);
          expect(React.findDOMNode(check[selectedItem]).className).not.to.contain(TestTemplate.selectedClass);

          TestUtils.Simulate.keyDown(check[selectedItem], { keyCode: KEY_CODE_RIGHT });
          expect(React.findDOMNode(check[selectedItem]).className).to.contain(TestTemplate.selectedClass);
          expect(React.findDOMNode(check[selectedItem-1]).className).not.to.contain(TestTemplate.selectedClass);
        });
      
    To make matters worse, this test exposes one of the many bugs with Karma runner. When using the FireFox launcher, Karma reports no errors. However, opening the FireFox dev tools in the Karma debug window shows that there were definitely failures. Fortunately, Chrome does not have the problem and faithfully shows the errors. Unfortunately, Travis-CI, only supports FireFox. So, yeah, this is a real pain point.

    The only solution I have found is to put a manual process in place to run the full test suite against multiple browsers. For that I created a `test-all` script. The script runs the tests against all the browsers by not specifying a `--browser` option. It doubles the processing time, and will not work on Travis-CI. However, it does a better job of testing. Before I commit anything to the repo, I run test-all.

    Given that this recently because a real pain point, I'm strongly considering trying [saucelabs](https://saucelabs.com/) as a replacement for Travis-CI. They have an opensauce project that keeps it free for open source projects and their pricing is not unreasonable for private testing. Also, their product is amazing.

    Alright, now that we can verify that there is a bug, how do we fix it? 

    The bug happens because we focus the new item when we call `selectItem`. This triggers a blur event on the last item. Our `onItemBlur` method then says to select none, which is certainly not what we want because we just selected a different item.

    There are several different ways to fix such a problem, but the easiest is to just add a property to the node which says to ignore the next blur. We put it just before we call focus. Normally, we should avoid adding properties to our nodes. However, this is a very short lived property, and it is very specific to this particular node at this particule time. So it is not the worst bit of code to write.

        selectItem: function(index) {
          if(this.state.selected !== index) {
            this.setState({ selected: index });
          }
          if(index !== NONE_SELECTED) {
            if(index < this.props.items.size) {

              this.ignoreBlur = true;

              this.focus(this.refs['item' + index]);
            }else if(this.props.onSelectNextField) {
              this.props.onSelectNextField();
            }
          }
        },

    Next, we need to tell our onItemBlur method to ignore the blur.

        onItemBlur: function() {
          if(!this.ignoreBlur) {
            this.selectItem(NONE_SELECTED);
          }else {
            this.ignoreBlur = undefined;
          }
        },

    Finally, we need to clear our ignoreBlur property or the blur event will never unselect the last selected item.

        componentDidUpdate: function() {
          this.ignoreBlur = undefined;
          this.updateLastItemBoundary();
        },

