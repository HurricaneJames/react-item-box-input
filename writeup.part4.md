## Parent Event Handlers

A parent component needs some way of knowing when some events happen. One way to do this might be to take a prop for important keys. In fact, if you look back through the git history, this was the original implementation. However, it is a bit limited.

Another method might be to just pass through any extra props. However, that is dangerous. Also, it would not help with things like onBlur.

So, what are the events we might care about?

    onKeyDown
    onKeyUp
    onFocus
    onBlur
    onCopy
    onCut
    onPaste
    drag/drop

We are going to leave drag/drop for later. It is a long term design goal to drag around the items in the list. It would also be nice to accept items from other lists. However, this writeup is already WAY too long. If you are interesting, Dan Abramov's excellent [React DND](https://github.com/gaearon/react-dnd) will probably help a lot. We can do something about the other events though.

Some of these events only make sense on the input element. For example, `onKeyDown` does not really apply when navigating around the items because they have their own interaction model.

Other events make sense only in context of the whole component. For example, `onFocus` and `onBlur` only make sense for the whole component. So, when something blurs, if nothing else is getting focus, we call onBlur. When something in the component is focused, and nothing was previously focused, we call onFocus.

We should also consider what happens when the input is focused or blurred. It is conceivable that the parent component would want to know about those events in addition to when the component as a whole is focused/blurred. To solve this we will add two callbacks, `onInputFocus` and `onInputBlur`.

## input element events

First, to save some time, we are going to add all of our supported prop types to the ItemBox propTypes declaration up front.

    onKeyUp: React.PropTypes.func,
    onKeyDown: React.PropTypes.func,
    onCopy: React.PropTypes.func,
    onCut: React.PropTypes.func,
    onPaste: React.PropTypes.func,
    onInputFocus: React.PropTypes.func,
    onInputBlur: React.PropTypes.func,
    onFocus: React.PropTypes.func,
    onBlur: React.PropTypes.func

- should support onKeyUp

        it('should support onKeyUp', function() {
          var mockKeyUp = sinon.spy();
          var view = TestUtils.renderIntoDocument(<TestComponent value="" onChange={mockOnChange} items={items} onKeyUp={mockKeyUp} />);
          var input = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
          TestUtils.Simulate.keyUp(input, { keyCode: KEY_CODE_COMMA });
          expect(mockKeyUp.called).to.be.ok();
        });

    The implementation only requires adding a single line to the end of the `onEntryKeyUp` method.

        if(this.props.onKeyUp) { this.props.onKeyUp(e); }

- should support onKeyDown

    This is the same as onKeyUp, but replace with onKeyDown.

        it('should support onKeyDown', function() {
          var mockKeyDown = sinon.spy();
          var view = TestUtils.renderIntoDocument(<TestComponent value="" onChange={mockOnChange} items={items} onKeyDown={mockKeyDown} />);
          var input = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
          TestUtils.Simulate.keyDown(input, { keyCode: KEY_CODE_COMMA });
          expect(mockKeyDown.called).to.be.ok();
        });

    The implementation only requires adding a single line to the end of the `onEntryKeyDown` method.

        if(this.props.onKeyDown) { this.props.onKeyDown(e); }

- should support onCopy, onCut, onPaste

        it('should support onCopy', function() {
          var someData = 'clipboard stuff';
          var mockOnCopy = sinon.spy();
          var view = TestUtils.renderIntoDocument(<TestComponent value="" onChange={mockOnChange} items={items} onCopy={mockOnCopy} />);
          var input = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
          TestUtils.Simulate.copy(input, { clipboardData: someData });
          expect(mockOnCopy.called).to.be.ok();
          expect(mockOnCopy.args[0][0].clipboardData).to.be(someData);
        });

    Implementation requires adding the onCopy prop to the input in the ItemBox render method.

        <input {...otherProps} onCopy={this.props.onCopy} />

    `onCut` is the same as onCopy, but find/replace the word 'Copy' with 'Cut'.

    `onPaste` is the same as onCopy, but find/replace the word 'Copy' with 'Paste'

- should support onInputFocus, onInputBlur

      it('should support onInputFocus', function() {
        var mockOnFocus = sinon.spy();
        var view = TestUtils.renderIntoDocument(<TestComponent value="" onChange={mockOnChange} items={items} onInputFocus={mockOnFocus} />);
        var input = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
        TestUtils.Simulate.focus(input);
        expect(mockOnFocus.called).to.be.ok();
      });

    Implementation requires adding the onFocus prop to the input in the ItemBox render method.

        <input {...otherProps} onFocus={this.props.onInputFocus}

    `onInputBlur` is the same as onInputFocus, but replace Focus with Blur.

# component level events

The input level events were relatively easy. The component level events are a LOT more complicated.

- should support onFocus

  We actually need to test a few different things for this requirement. First, we need to test that clicking on the input element triggers the onFocus event (we test onInputFocus up above). Second, we need to test that clicking on a list item triggers the onFocus event. However, we also need to test that trying to focus on anything in the componet when something else already has focus does not trigger the onFocus event.

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

          React.findDOMNode(input).focus();
          expect(mockEventHandler.calledTwice).not.to.be.ok();
        });

    Normally, I would give the implementation details here. However, this becaume a 4 hour testing nightmare. Honestly, I cannot remember exactly what I did to make these two tests pass.

    The problem turned out to be the Firefox launcher. I'm still not sure why it is not passing in Firefox. The Firefox inspector console in the Karma debug window says the test passed. However, the actual karma runner seems to think it failed. This cost me a few hours of frustration until I realized that is was the test engine that was broken.

    I have no desire to re-engineer the solution to just these two tests when the solution for the next requirement is already done. In that light, we are going to pretend that we did all of the tests for this section in one go. Thanks for your understanding. If you really want to know, it basically involves adding a focus state value to the ItemBox and calling the onFocus callback only if that value is set to false.

- should support onBlur

    onFocus was easy compared to onBlur. Even the test for onBlur is a nightmare.

    it('should support onBlur', function(done) {
      var mockEventHandler = sinon.spy();
      var view = safeRender(<TestComponent value="" onChange={mockOnChange} items={items} onBlur={mockEventHandler} />);
      var input = TestUtils.findRenderedDOMComponentWithTag(view, 'input');
      var itemComponents = TestUtils.scryRenderedDOMComponentsWithTag(view, 'li');

      React.findDOMNode(itemComponents[0]).click();
      setTimeout(function() {
        React.findDOMNode(input).focus();

        setTimeout(function() {
          expect(mockEventHandler.called).not.to.be.ok();
          React.findDOMNode(input).blur();

          setTimeout(function() {
            expect(mockEventHandler.calledOnce).to.be.ok();

            React.findDOMNode(itemComponents[0]).click();

            setTimeout(function() {
              React.findDOMNode(itemComponents[0]).blur();

              setTimeout(function() {
                expect(mockEventHandler.calledTwice).to.be.ok();
                done();
              }, 10);
            }, 10);
          }, 10);
        }, 10);
      }, 10);
    });

    Right away we see extreme oddness. Why all the nested setTimeouts? And why are we using browser events instead of React `TestUtils.Simulate` events. We use browser events because the test does not trigger otherwise. The setTimeouts will make more sense once we see the implementation.

    First up, we need to add focus and blur handlers on the ItemList. We will also need to modify the focus and blur handlers on the input component. Previously, we directed input `onFocus` events to the `props.onInputFocus` handler, and similar for on Blur. Now, we are going to replace those with handlers in the ItemBox component.

        <ItemList {...otherProps} onFocus={this.onItemListFocus} onBlur={this.onItemListBlur} />
        <input {...otherProps} onFocus={this.onInputFocus} onBlur={this.onInputBlur} />

    We need to make sure that onInputFocus and onInputBlur still call the props for onInputFocus and onInputBlur. We also need to think about when the different events might be called.

    - `onItemListFocus` is called when the list is focused. We have not implemented this yet. For now, just assume that this will trigger whenever the item receives a new focus, ie. when other item previously had focus. The only thing we need to do before triggering the onFocus event is check if either the input previously had focus. If it did not, we emit an onFocus event from the ItemBox. For clarity, we will extract all the state handling into a checkComponentFocus method.

            checkComponentFocus: function(e) {
              if(!this.state.focused) {
                if(this.props.onFocus) { this.props.onFocus(e); }
                this.setState({ focused: true });
              }
            },

            onItemListFocus: function(e) {
              this.ignoreInputBlur = true;
              this.ignoreListItemBlur = false;
              this.checkComponentFocus(e);
            },

        onItemListFocus also sets a couple flags. When the item list receives focus, it might be because the input element had focus. In that case, we need to ignore the corresponding input blur. Unfortunately, browsers trigger blur events prior to focus events... so, we will deal with that problem later. For now, just set a flag saying that we needed to ignore that last blur event. Also, set a flag saying not to ignore any itemList blur events because it has focus now.

        Finally, because we use the new state value `focus`, we should add that to our constructor.

            getInitialState: function() {
              return {
                //...
                focus: false
              };
            },

    - `onInputFocus` is called when the input element is focused. That could be because the user has clicked on it, the browser focused it for some reason, or because the ItemList triggered `onSelectNextField`. On the bright side, we know that it will not be triggered if it already has focus.

        Similar to onItemListFocus, we are going to use the same checkComponentFocus method. Also like onItemListFocus, we are going to set a couple flags to ignore that last item list blur event and listen to item blur events.

            onInputFocus: function(e) {
              if(this.props.onInputFocus) { this.props.onInputFocus(e); }
              this.ignoreInputBlur = false;
              this.ignoreListItemBlur = true;
              this.checkComponentFocus(e);
            },

    - `onInputBlur` is called whenever the input element loses focus. That happens when the user clicks off the component completely or when the users uses the keyboard to navigate to the item list. In the case of navigating to the item list, we do not want to trigger an onBlur event. However, as previously mentioned, we have a problem.

        There is no possible way to know if the browser is moments away from triggering a focus event on the item list. The only solution that I have found is to delay processing this event until the browser has finished triggering its events. We use a simple setTimeout for this.

            handleInputBlur: function() {
              if(!this.ignoreInputBlur) {
                this.triggerComponentBlur();
              }
              this.ignoreInputBlur = false;
            },
            onInputBlur: function(e) {
              if(this.props.onInputBlur) { this.props.onInputBlur(e); }
              setTimeout(this.handleInputBlur, 0);
            },

        We setTimeout for 0, so it triggers immediately once the browser is done with its set of events. The handleInputBlur method checks to see if we care about inputBlur events, and triggers it if we do.

            triggerComponentBlur: function(e) {
              if(this.state.focused) {
                if(this.props.onBlur) { this.props.onBlur(e); }
                this.setState({ focused: false });
              }
            },

        Much like checkComponentFocus, triggerComponentBlur checks to see if we have focus. If we do, then it triggers. Otherwise, it was merely a focus switch (though that should not happen thanks to our flags, the check costs almost nothing).

    - `onItemListBlur` is called whenever the item list loses focus. Like the input element, this could be because another sub-component is receiving focus. So we do the same delayed processing, and set the opposite set of flags.

            handleItemListBlur: function() {
              if(!this.ignoreListItemBlur) {
                this.triggerComponentBlur();
              }
              this.ignoreListItemBlur = false;
            },
            onItemListBlur: function() {
              setTimeout(this.handleItemListBlur, 0);
            },

    Before any of this will work, we need to add onFocus/onBlur handlers to the ItemList module too. This is easier than the ItemBox.

    First, add the props to our propType checker.

        onFocus: React.PropTypes.func,
        onBlur: React.PropTypes.func

    We are going to use a similar strategy to the one used in ItemBox. So we will add a focus value to our state.

        getInitialState: function() {
          return {
            selected: NONE_SELECTED,
            focused: false
          };
        },

    We will use similar methods offload triggering our onFocus/onBlur events.

        checkComponentFocus: function(e) {
          if(!this.state.focused) {
            if(this.props.onFocus) { this.props.onFocus(e); }
            this.setState({ focused: true });
          }
        },
        triggerBlur: function() {
          if(this.state.focused) {
            if(this.props.onBlur) { this.props.onBlur({ target: React.findDOMNode(this) }); }
            this.setState({ focused: false });
          }
        },

    We update the focus method to trigger the onFocus event if needed.

        focus: function(element) {
          if(element) { React.findDOMNode(element).focus(); }
          this.checkComponentFocus({ target: element });
        },

    Finally, we update the selectItem method to trigger onBlur when needed.

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

              this.triggerBlur();   // NEW
            }
          }else {                   // NEW
            this.triggerBlur();     // NEW
          }
        },

    Unlike ItemBox we do not need setTimeouts because we know exactly what is coming next. If `index !== NONE_SELECTED` then we are either selecting an item or we are selecting the nextField (ie. bluring). Alternatively, if we are selecting NONE_SELECTED, then that is the definition of blur.
    
    Now that we have seen the implementation, I hope the nested setTimeouts in the test make a little more sense. If we do not break the execution, the setTimeout in the ItemBox cannot run. If the setTimeout does not run, then the blur event will never be processed.

    