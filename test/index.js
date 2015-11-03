/**
 * Tests
 */
describe("Retsly Backbone", function () {
  it('Has loaded', function () {
    expect(Retsly).to.exist;
  })

  it('Has Model', function () {
    expect(Retsly.Model).to.exist;
  })

  it('Has Collection', function () {
    expect(Retsly.Collection).to.exist;
  })

  it('Model#url()', function () {
    var mock = {
      get: function(){return 'query'},
      options: {urlBase:'/api/v1'},
      fragment: 'listings',
      vendorID: 'test'
    };
    expect(Retsly.Model.prototype.url.call(mock)).to.equal('/api/v1/test/listings/query');
  });
})
