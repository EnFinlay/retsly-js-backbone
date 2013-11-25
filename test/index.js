
/**
 * Dependencies
 */
var assert = require('assert');
var OG = require('retsly-js-sdk');
var Retsly = require('retsly-backbone');

Retsly.debug = false;

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


suite('Retsly.create()');

test('throws if called without client_id & opts', function () {
  assert.throws(function(){ Retsly.create(); });
});

test('setup is chainable', function () {
  Retsly
    .client('test')
    .options({foo:true})
    .create();
});

test('returns same instance each call', function () {
  var r = Retsly.create();
  var s = Retsly.create();

  assert(r instanceof OG);
  assert(s instanceof OG);
  assert.equal(r, s);
});

test('pass new args to replace', function () {
  var r = Retsly.create();
  var s = Retsly.create('foo', {foo:false});
  var t = Retsly.create();

  assert.notEqual(r, s);
  assert.equal(s, t);
});


suite('Retsly.Model');

test('Model#url()', function () {
  var mock = {
    get: function(){return 'qux'},
    options: {urlBase:'foo'},
    fragment: 'bar',
    mls_id: 'baz'
  };

  assert(Retsly.Model.prototype.url.call(mock) == '/foo/bar/baz/qux.json');
});
