# React Item Box Input

[![npm package](https://img.shields.io/npm/v/react-item-box-input.svg?style=flat)](https://www.npmjs.org/package/react-item-box-input) [![Code Climate](https://codeclimate.com/github/HurricaneJames/react-item-box-input/badges/gpa.svg)](https://codeclimate.com/github/HurricaneJames/react-item-box-input) [![Test Coverage](https://codeclimate.com/github/HurricaneJames/react-item-box-input/badges/coverage.svg)](https://codeclimate.com/github/HurricaneJames/react-item-box-input)

This component implements an input box with a list of items inside the input box. It is possible to navigate the items with the arrow keys or by clicking on them. It is also possible to set trigger keys which fire a callback.

## Using Item Box Input

````javascript
var items = Immutable.fromJS([
  { data: { id: 1, text: 'aaa' }, template: SomeComponent },
  { data: { id: 2, text: 'bbb' } }
]);
<ItemBox
  items={items}
  itemTemplate={DifferentTemplate}
  value={this.state.value}
  onChange={this.onChange}
  triggerKeys={[KEY_CODE_COMMA]}
  onTrigger={this.onTrigger}
/>
````

Each item is rendered with by a template. If the item specifies its own template, that template is used. Next, the box checks for a prop supplied default (itemTemplate). Finally, ItemBox has a dumb default implementation.

The text entry is done with an input element. Whenever the user types, it is passed up via the onChange prop. There is also an onTrigger prop that will trigger when a keyUp event (useful for tracking keys like tab or escape that do not trigger onChange).

## Changelog
2.1.1
  - fix bug where hitting backspace on item in list causes the browser to go back in history
2.1.0
  - style updates so it looks more like a single input (2.2 will probably be an update to add better style control)

2.0.0 updated to work with React 0.14.0-rc1

1.1.1 fixed to work in environments that lack browser layout abilities (tests/isomorphic).
  - added a `defaultWidth` prop that will specify the width of the container for the item list when it cannot be determined from the browser

1.1.0 added component level `itemTemplate` prop to supply a default template.

1.0.0 initial release