var Immutable = require('immutable');
var React = require('react');
var TestUtils = require('react-addons-test-utils');
var ItemBox = require('../ItemBox');

describe('ItemBox', function() {
  it('should not blow up', function() {
    var name = 'test';
    var items = Immutable.fromJS([
      { id: 0, data: 'aaa' },
      { id: 1, data: 'bbb' }
    ]);
    TestUtils.renderIntoDocument(<ItemBox name={name} items={items} />);
    // expect this not to have failed
  });
});
