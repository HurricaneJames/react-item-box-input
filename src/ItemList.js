var React = require('react')
  , ImmutablePropTypes = require('react-immutable-proptypes');

const UL_STYLE = { listStyle: 'none', margin: 0, padding: 0, display: 'inline' };
const LI_STYLE = { display: 'inline' };

var ItemList = React.createClass({
  displayName: 'ItemList',
  propTypes: {
    items: ImmutablePropTypes.listOf(ImmutablePropTypes.shape({
      template: React.PropTypes.func,
      data: React.PropTypes.any.isRequired
    })).isRequired,
    defaultTemplate: React.PropTypes.func.isRequired,
    onLastItemRightBoundaryChange: React.PropTypes.func
  },
  componentDidMount: function() {
    this.updateLastItemBoundary();
  },
  componentDidUpdate: function() {
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
  renderItem: function(item, index) {
    return (
      <li key={item} style={LI_STYLE} ref={'item' + index} >
        {
          React.createElement(
            item.get('template') || this.props.defaultTemplate,
            {
              data: item.get('data')
              // selected: isSelected,
              // onRemove: this.onItemRemove.bind(null, index)
            }
          )
        }
      </li>
    );
  },
  render: function() {
    var items = this.props.items.map(this.renderItem).toArray();
    return (
      <ul style={UL_STYLE}>
        {
          items
        }
      </ul>
    );
  }

});

module.exports = ItemList;