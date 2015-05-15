/*eslint-disable react/no-did-mount-set-state, react/no-did-update-set-state */

// TODO - evaluate removing ResizeFrame in favor of react-component-resizable (performane/memory characteristics of each)

var React = require('react')
  , Immutable = require('immutable')
  , ImmutablePropTypes = require('react-immutable-proptypes')
  , ResizeDetector = require('./ResizeDetector');

var KEY_CODE_LEFT = 37
  , KEY_CODE_RIGHT = 39
  , KEY_CODE_DELETE = 48
  , KEY_CODE_BACKSPACE = 8;

var NONE_SELECTED = -1;

var TEST_AREA_STYLE = {
  position: 'absolute',
  visibility: 'hidden',
  height: 'auto',
  width: 'auto',
  whiteSpace: 'nowrap'
};

var DEFAULT_TEMPLATE_CLASS = 'item';
var DEFAULT_TEMPLATE_SELECTED_CLASS = 'selected';
var DEFAULT_TEMPLATE_DELETE_BUTTON_CLASS = 'delete';
var DefaultTemplate = React.createClass({
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
        className={DEFAULT_TEMPLATE_CLASS + (this.props.selected ? ' ' + DEFAULT_TEMPLATE_SELECTED_CLASS : '')}
        style={{display: 'inline-block'}}
      >
        {this.props.data.get('text')}
        <span className={DEFAULT_TEMPLATE_DELETE_BUTTON_CLASS} onClick={this.props.onRemove}>X</span>
      </div>
    );
  }
});
var ItemBox = React.createClass({
  displayName: 'ItemBox',
  propTypes: {
    value: React.PropTypes.string,
    onChange: React.PropTypes.func,
    items: ImmutablePropTypes.listOf(ImmutablePropTypes.shape({
      template: React.PropTypes.func,
      data: React.PropTypes.any.isRequired
    })).isRequired,
    itemTemplate: React.PropTypes.func,
    onRemove: React.PropTypes.func,
    triggerKeys: React.PropTypes.arrayOf(React.PropTypes.number),
    onTrigger: React.PropTypes.func
  },
  getDefaultProps: function() {
    return {
      items: new Immutable.List()
    };
  },
  getInitialState: function() {
    return {
      width: '1em',
      selected: NONE_SELECTED
    };
  },
  componentDidMount: function() {
    this.resizeEntryWidth(this.props.value);
  },
  componentDidUpdate: function() {
    this.ignoreBlur = undefined;
    this.resizeEntryWidth(this.props.value);
  },
  resizeEntryWidth: function(entryText) {
    var node = this.refs.entry.getDOMNode();
    var entryOffset = this.props.items.size > 0 ? Math.ceil(this.refs['item' + (this.props.items.size - 1)].getDOMNode().getBoundingClientRect().right) : node.offsetLeft;
    var maxWidth = node.parentNode.clientWidth;
    var textWidth = this.getTextWidth(entryText);
    var newWidth = (textWidth + entryOffset > maxWidth) ? maxWidth : maxWidth - entryOffset;
    if(newWidth !== this.state.width) {
      this.setState({ width: newWidth });
    }
  },
  getTextWidth: function(text) {
    var node = this.refs.testarea.getDOMNode();
    node.innerHTML = text;
    return node.offsetWidth;
  },
  getCaretPosition: function (inputElement) {
    if('selectionStart' in inputElement) {
      return inputElement.selectionStart;
    }else {
      var selection = document.selection.createRange();
      var selectionLength = document.selection.createRange().text.length;
      selection.moveStart('character', -inputElement.value.length);
      return selection.text.length - selectionLength;
    }
  },
  focus: function(element) {
    if(element) { element.getDOMNode().focus(); }
  },
  isSelected: function(item, index) {
    return this.state.selected === index;
  },
  selectItem: function(index) {
    if(this.state.selected !== index) {
      this.setState({ selected: index });
    }
    if(index < this.props.items.size) {
      this.ignoreBlur = true;
      this.focus(this.refs['item' + index]);
    }else if(index > -1) {
      this.focus(this.refs.entry);
    }
  },
  selectPrevious: function() {
    if(this.state.selected > -1) { this.selectItem(this.state.selected - 1); }
  },
  selectNext: function() {
    if(this.state.selected <= this.props.items.size) { this.selectItem(this.state.selected + 1); }
  },
  onChange: function(e) {
    if(this.props.onChange) { this.props.onChange(e); }
  },
  onEntryKeyDown: function(e) {
    e.stopPropagation();
    if(e.keyCode === KEY_CODE_LEFT) {
      var position = this.getCaretPosition(e.target);
      if(position === 0) {
        this.selectItem(this.props.items.size - 1);
      }
    }
  },
  onEntryKeyUp: function(e) {
    e.stopPropagation();
    if(this.props.onTrigger && this.props.triggerKeys.indexOf(e.keyCode) > -1) {
      this.props.onTrigger(e.keyCode, e.target.value);
    }
  },
  onItemBlur: function() {
    // there is an edge case where selecting previous/next automatically blurs before setState can run
    // so we use a property set on this to check
    if(!this.ignoreBlur) {
      this.ignoreBlur = undefined;
      this.selectItem(-1);
    }
  },
  onItemClick: function(index, e) {
    e.preventDefault();
    e.stopPropagation();
    this.selectItem(index);
  },
  onItemRemove: function(index) {
    if(this.props.onRemove) { this.props.onRemove(index); }
  },
  onKeyDown: function(e) {
    switch(e.keyCode) {
      case KEY_CODE_LEFT:
        this.selectPrevious();
        break;
      case KEY_CODE_RIGHT:
        this.selectNext();
        break;
      case KEY_CODE_DELETE:
      case KEY_CODE_BACKSPACE:
        e.preventDefault();
        e.stopPropagation();
    }
  },
  onKeyUp: function(e) {
    switch(e.keyCode) {
      case KEY_CODE_DELETE:
      case KEY_CODE_BACKSPACE:
        if(this.state.selected > -1 && this.state.selected < this.props.items.size) {
          this.props.onRemove(this.state.selected);
        }
        break;
    }
  },
  onResize: function() {
    this.resizeEntryWidth(this.props.value);
  },
  render: function() {
    return (
      <div onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp}>
        <ResizeDetector onResize={this.onResize} />
        <div ref="testarea" className="testarea" style={TEST_AREA_STYLE} />
        { // Items
          this.props.items.map(function(item, index) {
            var isSelected = this.isSelected(item, index);
            return (
              <span
                tabIndex="0"
                ref={'item' + index}
                key={index}
                onBlur={this.onItemBlur}
                onClick={this.onItemClick.bind(null, index)}
              >
                {
                  React.createElement(item.get('template') || this.props.itemTemplate || DefaultTemplate, {
                    data: item.get('data'),
                    selected: isSelected,
                    onRemove: this.onItemRemove.bind(null, index)
                  })
                }
              </span>
            );
          }, this)
        }
        <input
          ref="entry"
          value={this.props.value}
          onChange={this.onChange}
          onKeyDown={this.onEntryKeyDown}
          onKeyUp={this.onEntryKeyUp}
          style={{ display: 'inline-block', width: this.state.width }}
        />
      </div>
    );
  }
});

module.exports = ItemBox;
