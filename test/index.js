/**
 * Tests
 */
describe("Retsly Backbone", function () {
  it('Has loaded', function () {
    expect(RetslyBackbone).to.exist;
  })

  it('Has Model', function () {
    expect(RetslyBackbone.Model).to.exist;
  })

  it('Has Collection', function () {
    expect(RetslyBackbone.Collection).to.exist;
  })

  it('Model#url()', function () {
    var mock = {
      get: function(){return 'query'},
      options: {urlBase:'/api/v1'},
      fragment: 'listings',
      vendorID: 'test'
    };
    expect(RetslyBackbone.Model.prototype.url.call(mock)).to.equal('/api/v1/test/listings/query');
  });
})

describe("Get collection", function () {
  it('Gets listings collection', function (done) {
    RetslyBackbone.create('<USER CLIENT ID>', '6baca547742c6f96a6ff71b138424f21');

    var collection = new RetslyBackbone.Collections.Listings({vendorID: 'test'});

    // Fetch collection
    collection.fetch({success: function (response) {
      expect(response).to.exist;
      expect(response.models).to.have.length(10);
      done();
    }})
  });
})
