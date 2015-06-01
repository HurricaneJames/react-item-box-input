var React = require('react')
  , ImmutablePropTypes = require('react-immutable-proptypes');

var TEST_TEMPLATE_CLASS = 'findme';
var TEST_TEMPLATE_SELECTED_CLASS = 'selected';
var TEST_TEMPLATE_DELETE_BUTTON_CLASS = 'deleteMe';

function createTestTemplate(id) {
  id = id || '';
  var template = React.createClass({
    displayName: 'TestTemplate' + id,
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
          className={TEST_TEMPLATE_CLASS + id + (this.props.selected ? ' ' + TEST_TEMPLATE_SELECTED_CLASS : '')}
          style={{display: 'inline-block'}}
        >
          {this.props.data.get('text')}
          <span className={TEST_TEMPLATE_DELETE_BUTTON_CLASS} onClick={this.props.onRemove} />
        </div>
      );
    }
  });

  template.templateClass = TEST_TEMPLATE_CLASS + id;
  template.selectedClass = TEST_TEMPLATE_SELECTED_CLASS;
  template.deleteButtonClass = TEST_TEMPLATE_DELETE_BUTTON_CLASS;

  return template;
}

module.exports = {
  default: createTestTemplate(''),
  alternate: createTestTemplate('_2')
};