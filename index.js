
/**
 * Dependencies
 */
var Backbone = window.Backbone || require('backbone');
var $ = Backbone.$ = require('jquery');
var extend = require('underscore').extend;
var result = require('underscore').result;
var each = require('underscore').each;
var Retsly = require('retsly-js-sdk');


/**
 * Backbone for Retsly
 */
module.exports = Retsly;


/**
 * Public Retsly Section / View Helpers
 */
Retsly.Section = Backbone.View.extend({
  open: function() {
    $(".ui-active").removeClass("ui-active");
    this.$el.addClass("ui-active");
    return this;
  }
});


/**
 * Retsly Parent Model
 */
var Model = Retsly.Model = Backbone.Model.extend({
  defaults: {},
  idAttribute: 'id',
  transport: 'retsly',
  initialize: function(attrs, options) {

    // If there is no options, then set options to first input
    if (attrs && !options)
      options = attrs;

    if (options && !options.vendorID)
      throw new Error('requires vendorID `{vendorID: \'id\'}`');

    this.retsly = Retsly.create();
    this.options = extend({urlBase:'/api/v1'}, options); // TODO ??
    this.collection = options.collection;
    this.vendorID = this.options.vendorID;
  },
  url: function() {
    if (this.fragment === 'vendors') {
      return [
          this.options.urlBase,
          this.fragment,
          this.vendorID
        ].join('/');
    }
    return [
        this.options.urlBase,
        this.vendorID,
        this.fragment,
        this.get('_id')
      ].join('/');
  }
});

/**
 * Retsly Parent Collection
 */
var Collection = Retsly.Collection = Backbone.Collection.extend({
  transport: 'retsly',
  initialize: function(attrs, options) {

    // If there is no options, then set options to first input
    if (attrs && !options)
      options = attrs;

    if (options && !options.vendorID)
      throw new Error('requires vendorID `{vendorID: \'id\'}`');

    this.retsly = Retsly.create();
    this.options = extend({urlBase: '/api/v1'}, options);
    this.vendorID = this.options.vendorID;
  },
  model: function(attrs, opts) {
    var col = opts.collection;
    return new col.Model(attrs, { collection: col, vendorID: col.vendorID });
  },
  url: function() {
    if (this.fragment === 'vendors') {
      return [
          this.options.urlBase,
          this.fragment,
          this.vendorID
        ].join('/');
    }
    return [
        this.options.urlBase,
        this.vendorID,
        this.fragment
      ].join('/');
  }
});


/**
 * Retsly models
 */
var models = Retsly.Models = {};
models.Agent = Model.extend({fragment: 'agents'});
models.Office = Model.extend({fragment: 'offices'});
models.Listing = Model.extend({fragment: 'listings'});
models.Agent = Model.extend({fragment: 'agents'});
models.OpenHouse = Model.extend({fragment: 'openhouses'});
models.Media = Model.extend({fragment: 'media'});
models.Vendor = Model.extend({fragment: 'vendors'});
models.Parcel = Model.extend({fragment: 'parcels'});
models.Assessment = Model.extend({fragment: 'assessments'});
models.Transaction = Model.extend({fragment: 'transactions'});


/**
* Retsly Collections
*/
var collections = Retsly.Collections = {};
collections.Agents = Collection.extend({fragment: 'agents', Model: models.Agent});
collections.Offices = Collection.extend({fragment: 'offices', Model: models.Office});
collections.Listings = Collection.extend({fragment: 'listings', Model: models.Listing});
collections.Agents = Collection.extend({fragment: 'agents', Model: models.Agent});
collections.OpenHouses = Collection.extend({fragment: 'openhouses', Model: models.OpenHouse});
collections.Medias = Collection.extend({fragment: 'media', Model: models.Media});
collections.Vendors = Collection.extend({fragment: 'vendors', Model: models.Vendor});
collections.Parcels = Collection.extend({fragment: 'parcels', Model: models.Parcel});
collections.Assessments = Collection.extend({fragment: 'assessments', Model: models.Assessment});
collections.Transactions = Collection.extend({fragment: 'transactions', Model: models.Transaction});


collections.Photos = Collection.extend({
  fragment: 'photo',
  model: undefined,
  initialize: function(listing, options) {
    this.listing = listing;
    Collection.call(this, {}, options);
  },
  complete: function(photos) {
    if(this.listing) this.listing.set('Photos', this);
    if(typeof this.options.complete === 'function')
      this.options.complete(this.listing);
  }
});

// Mongo-friendly by default
Backbone.Model.prototype.idAttribute = 'id';

/**
 * HTTP uses response.bundle, sockets use response. Normalize them.
 */
Backbone.Model.prototype.parse = function(response, options) {
  return response.bundle ? response.bundle : response;
};
Backbone.Collection.prototype.parse = function(response, options) {
  return response.bundle ? response.bundle : response;
};

Backbone.ajaxSync = Backbone.sync;

/**
 * Authenticate HTTP requests with Authorization header
 */
Backbone.origAjax = Backbone.ajax;
Backbone.ajax = function(request) {
  request.beforeSend = function(jqXHR, settings) {
    var retsly = Retsly.create();
    var concat = (settings.url.indexOf('?') > -1) ? '&' : '?';
    settings.url = settings.url+concat+'client_id='+retsly.client_id;
    var token = retsly.getUserToken() ? retsly.getUserToken() : retsly.getAppToken();
    jqXHR.setRequestHeader('Authorization', 'Bearer '+ token);
  };
  Backbone.origAjax(request);
};

Backbone.getSyncMethod = function(model) {
  if(model.transport == 'retsly' || (model.collection && model.collection.transport == 'retsly')) {
    return Backbone.retsly;
  }
  return Backbone.ajaxSync;
};

Backbone.sync = function(method, model, options) {
  return Backbone.getSyncMethod(model).apply(this, [method, model, options]);
};

/* Use the Retsly sdk as transport */

Backbone.retsly = function(method, model, options) {
  var resp, errorMessage;

  // Alway wait for server to respond
  options.wait = true;

  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  var methodMap = {
    'create': 'post',
    'update': 'put',
    'delete': 'del',
    'read':   'get'
  };

  // Ensure that we have a URL.
  if (!options.url) {
    options.url = result(model, 'url') || urlError();
  }

  var syncMethod = methodMap[method].toLowerCase();

  switch(syncMethod) {
    case 'del':
      debug('--> delete '+options.url, options.data || {});
      model.retsly.del(options.url, model.toJSON(), function(res) {
        debug('<-- delete '+options.url, res);
        if(res.success) {
          if(typeof options.success == 'function') options.success(res);
        } else {
          if(typeof options.error == 'function') options.error(res);
          model.trigger('error', model, options, res);
        }
        if(model.complete) model.complete(res.bundle, options, res);
        if(typeof model.get(res.id) !== "undefined"){
          model.remove(res.bundle);
          model.trigger('remove', model.get(res.id), options, res);
        }

      });
    break;

    case 'put':
      debug('--> put '+options.url, model.toJSON());
      var json = model.toJSON(); delete json['_id'];
      model.retsly.put(options.url, json, function(res) {
        debug('<-- put '+options.url, res);
        if(res.success) {
          if(typeof options.success == 'function') options.success(res);
        } else {
          if(typeof options.error == 'function') options.error(res);
          model.trigger('error', model, res, options);
        }
        if(model.complete) model.complete(res.bundle, options, res);
        if(typeof model.get(res.id) === "undefined"){
          if(typeof model.add === 'function') model.add(res.bundle);
        } else {
          model.get(res.id).set(res.bundle);
          model.trigger('change', model.get(res.id), options, res);
        }

      });
    break;

    case 'post':
      debug('--> post '+options.url, options.data || {});
      model.retsly.post(options.url, model.toJSON(), function(res) {
        debug('<-- post '+options.url, res);
        if(res.success) {
          if(typeof options.success == 'function') options.success(res);
        } else {
          if(typeof options.error == 'function') options.error(res);
          model.trigger('error', model, res, options);
        }
        if(model.complete) model.complete(res.bundle, options, res);
        if(typeof model.get(res.id) === "undefined"){
          if(typeof model.add === 'function') model.add(res.bundle);
        } else {
          model.get(res.id).set(res.bundle);
          model.trigger('change', model.get(res.id), options, res);
        }

      });
    break;

    case 'get': default:

      debug('--> get '+options.url, options.data || {});
      model.retsly.get(options.url, options.data, function(res) {
        debug('<-- get '+options.url, res);
        if(res.success) {
          if(typeof options.success == 'function') options.success(res);
          model.trigger('reset', model, options, res);
        } else {
          if(typeof options.error == 'function') options.error(res);
          model.trigger('error', model, options, res);
        }
      });
    break;
  }
};


/**
 * Logs only if debug mode
 */
function debug () {
  if (Retsly.debug) console.log.apply(console, arguments);
}
