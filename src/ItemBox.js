/*eslint-disable react/no-did-mount-set-state, react/no-did-update-set-state */

var React = require('react')
  , Immutable = require('immutable')
  , ImmutablePropTypes = require('react-immutable-proptypes')
  , ItemList = require('./ItemList')
  , DefaultTemplate = require('./DefaultTemplate');

var ItemBox = React.createClass({
  displayName: 'ItemBox',
  propTypes: {
    value: React.PropTypes.string,
    onChange: React.PropTypes.func,
    items: ImmutablePropTypes.list.isRequired,
    itemTemplate: React.PropTypes.func.isRequired
  },
  getDefaultProps: function() {
    return {
      items: new Immutable.List(),
      itemTemplate: DefaultTemplate
    };
  },
  getInitialState: function() {
    return {
    };
  },
  render: function() {
    return (
      <div>
        <ItemList items={this.props.items} defaultTemplate={this.props.itemTemplate} />
        <input type="text" value={this.props.value} onChange={this.props.onChange} />
      </div>
    );
  }
});

module.exports = ItemBox;
