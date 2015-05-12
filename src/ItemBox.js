var React = require('react');

var ItemBox = React.createClass({
  displayName: 'ItemBox',
  propTypes: {
    value: React.PropTypes.string
  },
  render: function() {
    return (
      <div>
        <input value={this.props.value} />
      </div>
    );
  }});

module.exports = ItemBox;