require('./testdom')();
var Immutable = require('immutable');
var React = require('react/addons');
var TestUtils = React.addons.TestUtils;
var ItemBox = require('../ItemBox');

describe('ItemBox', function() {
  it('should not blow up', function() {
    var name = 'test';
    var contributors = Immutable.fromJS([
      { id: 0, title: 'aaa', affiliateName: 'AAA' },
      { id: 1, title: 'bbb', affiliateName: 'BBB' }
    ]);
    TestUtils.renderIntoDocument(<ItemBox name={name} contributors={contributors} />);
    // expect this not to have failed
  });
});
