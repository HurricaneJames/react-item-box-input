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
    defaultTemplate: React.PropTypes.func.isRequired
  },
  renderItem: function(item) {
    return (
      <li key={item} style={LI_STYLE}>
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
    var items = this.props.items.map(item => this.renderItem(item)).toArray();
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