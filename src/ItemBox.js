/*eslint-disable react/no-did-mount-set-state, react/no-did-update-set-state, dot-notation */

var React = require('react')
  , Immutable = require('immutable')
  , ImmutablePropTypes = require('react-immutable-proptypes')
  , ItemList = require('./ItemList')
  , DefaultTemplate = require('./DefaultTemplate')
  , ResizeDetector = require('./ResizeDetector')
  , KeyCodes = require('./KeyCodes');

const TEST_AREA_STYLE = {
  position: 'absolute',
  visibility: 'hidden',
  height: 'auto',
  width: 'auto',
  whiteSpace: 'nowrap'
};

var ItemBox = React.createClass({
  displayName: 'ItemBox',
  propTypes: {
    value: React.PropTypes.string,
    onChange: React.PropTypes.func,
    items: ImmutablePropTypes.list.isRequired,
    itemTemplate: React.PropTypes.func.isRequired,
    onRemove: React.PropTypes.func,
    defaultWidth: React.PropTypes.number,       // the default width (in px) of the component if it cannot be determined by the DOM
    onKeyUp: React.PropTypes.func,
    onKeyDown: React.PropTypes.func,
    onCopy: React.PropTypes.func,
    onCut: React.PropTypes.func,
    onPaste: React.PropTypes.func,
    onInputFocus: React.PropTypes.func,
    onInputBlur: React.PropTypes.func,
    onFocus: React.PropTypes.func,
    onBlur: React.PropTypes.func
  },
  getDefaultProps: function() {
    return {
      items: new Immutable.List(),
      itemTemplate: DefaultTemplate,
      defaultWidth: 500
    };
  },
  getInitialState: function() {
    return {
      width: '1em',
      lastItemRightBoundary: 0,
      focus: false
    };
  },
  componentDidMount: function() {
    this.resizeEntryWidth(this.props.value);
  },
  componentDidUpdate: function() {
    this.resizeEntryWidth(this.props.value);
  },
  updateRightBoundary: function(newRightBoundary) {
    if(this.state.lastItemRightBoundary !== newRightBoundary) {
      this.setState({lastItemRightBoundary: newRightBoundary});
    }
  },
  resizeEntryWidth: function(entryText) {
    var newWidth = this.getCorrectEntryWidth(entryText);
    if(newWidth !== this.state.width) {
      this.setState({ width: newWidth });
    }
  },
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
  getCorrectEntryWidth: function(entryText) {
    var node = React.findDOMNode(this.refs['entry']);
    var entryOffset = (this.state.lastItemRightBoundary > 0 ? this.state.lastItemRightBoundary : node.offsetLeft) || 0;
    var maxWidth = node.parentNode.clientWidth || this.props.defaultWidth;
    var textWidth = this.getTextWidth(entryText) || 0;
    return (textWidth + entryOffset > maxWidth) ? maxWidth : maxWidth - entryOffset;
  },
  getTextWidth: function(text) {
    var node = React.findDOMNode(this.refs['testarea']);
    node.innerHTML = text;
    return node.offsetWidth;
  },
  keyboardSelectLastItem: function(e) {
    var position = this.getCaretPosition(e.target);
    if(position === 0) {
      this.refs['itemList'].selectLast();
    }
  },
  checkComponentFocus: function(e) {
    if(!this.state.focused) {
      if(this.props.onFocus) { this.props.onFocus(e); }
      this.setState({ focused: true });
    }
  },
  triggerComponentBlur: function(e) {
    if(this.state.focused) {
      if(this.props.onBlur) { this.props.onBlur(e); }
      this.setState({ focused: false });
    }
  },
  onEntryKeyDown: function(e) {
    e.stopPropagation();
    if(e.keyCode === KeyCodes.LEFT_ARROW) {
      this.keyboardSelectLastItem(e);
    }
    if(this.props.onKeyDown) { this.props.onKeyDown(e); }
  },
  onEntryKeyUp: function(e) {
    e.stopPropagation();
    if(e.keyCode === KeyCodes.BACKSPACE) {
      this.keyboardSelectLastItem(e);
    }
    if(this.props.onKeyUp) { this.props.onKeyUp(e); }
  },
  onInputFocus: function(e) {
    if(this.props.onInputFocus) { this.props.onInputFocus(e); }
    this.ignoreInputBlur = false;
    this.ignoreListItemBlur = true;
    this.checkComponentFocus(e);
  },
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
  onItemListFocus: function(e) {
    this.ignoreInputBlur = true;
    this.ignoreListItemBlur = false;
    this.checkComponentFocus(e);
  },
  handleListItemBlur: function() {
    if(!this.ignoreListItemBlur) {
      this.triggerComponentBlur();
    }
    this.ignoreListItemBlur = false;
  },
  onItemListBlur: function() {
    setTimeout(this.handleListItemBlur, 0);
  },
  onItemListSelectNextField: function() {
    var entry = this.refs['entry'];
    if(entry) { React.findDOMNode(entry).focus(); }
  },
  onResize: function() {
    this.resizeEntryWidth(this.props.value);
  },
  render: function() {
    var inputStyle = {
      display: 'inline-block',
      width: this.state.width
    };
    return (
      <div>
        <ResizeDetector onResize={this.onResize} />
        <div ref="testarea" className="testarea" style={TEST_AREA_STYLE} />
        <ItemList
          ref="itemList"
          items={this.props.items}
          defaultTemplate={this.props.itemTemplate}
          onLastItemRightBoundaryChange={this.updateRightBoundary}
          onSelectNextField={this.onItemListSelectNextField}
          onRemove={this.props.onRemove}
          onFocus={this.onItemListFocus}
          onBlur={this.onItemListBlur}
        />
        <input
          ref="entry"
          type="text"
          value={this.props.value}
          onChange={this.props.onChange}
          onKeyDown={this.onEntryKeyDown}
          onKeyUp={this.onEntryKeyUp}
          style={inputStyle}
          onCopy={this.props.onCopy}
          onCut={this.props.onCut}
          onPaste={this.props.onPaste}
          onFocus={this.onInputFocus}
          onBlur={this.onInputBlur}
        />
      </div>
    );
  }
});

module.exports = ItemBox;
