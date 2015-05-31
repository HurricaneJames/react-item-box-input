/*eslint-disable react/no-did-mount-set-state, react/no-did-update-set-state, dot-notation */

var React = require('react')
  , Immutable = require('immutable')
  , ImmutablePropTypes = require('react-immutable-proptypes')
  , ItemList = require('./ItemList')
  , DefaultTemplate = require('./DefaultTemplate')
  , ResizeDetector = require('./ResizeDetector');

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
    defaultWidth: React.PropTypes.number        // the default width (in px) of the component if it cannot be determined by the DOM
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
      lastItemRightBoundary: 0
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
        <ItemList items={this.props.items} defaultTemplate={this.props.itemTemplate} onLastItemRightBoundaryChange={this.updateRightBoundary} />
        <input ref="entry" type="text" value={this.props.value} onChange={this.props.onChange} style={inputStyle} />
      </div>
    );
  }
});

module.exports = ItemBox;
