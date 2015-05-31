var React = require('react');

const DEFAULT_TEMPLATE_CLASS = 'item';
const DEFAULT_TEMPLATE_SELECTED_CLASS = 'selected';
const DEFAULT_TEMPLATE_DELETE_BUTTON_CLASS = 'delete';
var DefaultTemplate = React.createClass({
  displayName: 'DefaultTemplate',
  propTypes: {
    data: React.PropTypes.any.isRequired,
    selected: React.PropTypes.bool,
    onRemove: React.PropTypes.func
  },
  render: function() {
    return (
      <div
        className={
          DEFAULT_TEMPLATE_CLASS +
          (this.props.selected ? ' ' + DEFAULT_TEMPLATE_SELECTED_CLASS : '')
        }
        style={{display: 'inline-block'}}
      >
        {
          this.props.data.toString()
        }
        <span className={DEFAULT_TEMPLATE_DELETE_BUTTON_CLASS} onClick={this.props.onRemove}>X</span>
      </div>
    );
  }
});

module.exports = DefaultTemplate;