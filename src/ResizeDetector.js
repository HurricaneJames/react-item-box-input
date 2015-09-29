var React = require('react');

var RESIZE_FRAME_STYLE = {
  position: 'absolute',
  visibility: 'hidden',
  height: '100%',
  width: '100%'
};

var ResizeDetector = React.createClass({
  displayName: 'ResizeDetector',
  propTypes: {
    onResize: React.PropTypes.func.isRequired
  },
  componentDidMount: function() {
    var document = this.refs.iframe.contentDocument;
    if(document) (document.defaultView || document.parentWindow).addEventListener('resize', this.handleResize);
  },
  componentWillUnmount: function() {
    var document = this.refs.iframe.contentDocument;
    if(document) (document.defaultView || document.parentWindow).removeEventListener('resize', this.handleResize);
  },
  handleResize: function() {
    this.props.onResize();
  },
  render: function() {
    return <iframe ref='iframe' style={RESIZE_FRAME_STYLE} />;
  }
});

module.exports = ResizeDetector;
