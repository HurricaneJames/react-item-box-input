var React = require('react/addons');
var TestUtils = React.addons.TestUtils;
var sinon = require('sinon');
var expect = require('expect.js');

var COMPONENT = 'ItemBox';

describe(COMPONENT, function() {
  var TestComponent, sandbox;
  beforeEach(function() {
    // fails
    // TestComponent = require('../' + COMPONENT);
    TestComponent = require('../ItemBox');
    sandbox = sinon.sandbox.create();
    sandbox.stub(console, 'warn');
  });

  afterEach(function() {
    sinon.assert.notCalled(console.warn);
    sandbox.restore();
  });

  it('should have an input element containing the value prop', function() {
    var value = 'xyzzy';
    var view = TestUtils.renderIntoDocument(<TestComponent value={value} />);
    var check = TestUtils.scryRenderedDOMComponentsWithTag(view, 'input');
    expect(check.length).to.be(1);
    expect(check[0].getDOMNode().value).to.be(value);
  });
});