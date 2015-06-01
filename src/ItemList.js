var React = require('react')
  , ImmutablePropTypes = require('react-immutable-proptypes')
  , KeyCodes = require('./KeyCodes');

const UL_STYLE = { listStyle: 'none', margin: 0, padding: 0, display: 'inline' };
const LI_STYLE = { display: 'inline' };
const NONE_SELECTED = -1;

var ItemList = React.createClass({
  displayName: 'ItemList',
  propTypes: {
    items: ImmutablePropTypes.listOf(ImmutablePropTypes.shape({
      template: React.PropTypes.func,
      data: React.PropTypes.any.isRequired
    })).isRequired,
    defaultTemplate: React.PropTypes.func.isRequired,
    onLastItemRightBoundaryChange: React.PropTypes.func,
    onSelectNextField: React.PropTypes.func,
    onRemove: React.PropTypes.func
  },
  getInitialState: function() {
    return {
      selected: NONE_SELECTED
    };
  },
  componentDidMount: function() {
    this.updateLastItemBoundary();
  },
  componentDidUpdate: function() {
    this.ignoreBlur = undefined;
    this.updateLastItemBoundary();
  },
  updateLastItemBoundary: function() {
    if(this.props.onLastItemRightBoundaryChange) {
      if(this.props.items.size > 0) {
        var lastItem = this.refs['item' + (this.props.items.size - 1)];
        var newBoundary = Math.ceil(React.findDOMNode(lastItem).getBoundingClientRect().right);
        this.props.onLastItemRightBoundaryChange(newBoundary);
      }else {
        this.props.onLastItemRightBoundaryChange(React.findDOMNode(this).getBoundingClientRect().right);
      }
    }
  },
  focus: function(element) {
    if(element) { React.findDOMNode(element).focus(); }
  },
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
  selectLast: function() {
    this.selectItem(this.props.items.size - 1);
  },
  selectPrevious: function() {
    if(this.state.selected !== NONE_SELECTED) { this.selectItem(this.state.selected - 1); }
  },
  selectNext: function() {
    if(this.state.selected <= this.props.items.size) { this.selectItem(this.state.selected + 1); }
  },
  onItemBlur: function() {
    if(!this.ignoreBlur) {
      this.selectItem(NONE_SELECTED);
    }else {
      this.ignoreBlur = false;
    }
  },
  onItemClick: function(index, e) {
    e.preventDefault();
    e.stopPropagation();
    this.selectItem(index);
  },
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
  renderItem: function(item, index) {
    return (
      <li
        key={index}
        ref={'item' + index}
        style={LI_STYLE}
        onClick={this.onItemClick.bind(null, index)}
        onBlur={this.onItemBlur}
        tabIndex="0"
      >
        {
          this.renderTemplate(item, index)
        }
      </li>
    );
  },
  render: function() {
    var items = this.props.items.map(this.renderItem).toArray();
    return (
      <ul style={UL_STYLE} onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp}>
        {
          items
        }
      </ul>
    );
  }

});

module.exports = ItemList;