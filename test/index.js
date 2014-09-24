
/**
 * Dependencies
 */
var assert = require('assert');
var Retsly = require('retsly-js-backbone');

/**
 * Tests
 */
suite('Retsly');

test('Retsly has models', function () {
  assert('object' == typeof Retsly.Models);
})

test('Retsly has collections', function () {
  assert('object' == typeof Retsly.Collections);
});

test('Retsly has Section', function () {
  assert('function' == typeof Retsly.Section);
});


suite('Retsly.Model');

test('Model#url()', function () {
  var mock = {
    get: function(){return 'qux'},
    options: {urlBase:'/foo'},
    fragment: 'bar',
    vendorID: 'baz'
  };
  assert(Retsly.Model.prototype.url.call(mock) === '/foo/bar/baz/qux');
});
