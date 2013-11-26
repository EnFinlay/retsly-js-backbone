
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
  idAttribute: '_id',
  transport: 'socket',
  initialize: function(attrs, options) {

    if (options && !options.vendor_id)
      throw new Error('requires vendor_id `{vendor_id: \'id\'}`');

    this.retsly = Retsly.create();
    this.options = extend({urlBase:'/api/v1'}, options); // TODO ??
    this.collection = options.collection;
    this.vendor_id = options.vendor_id;
  },
  url: function() {
    return [
        this.options.urlBase,
        this.fragment,
        this.vendor_id,
        this.get('_id')
      ].join('/')+'.json';
  }
});

/**
 * Retsly Parent Collection
 */
var Collection = Retsly.Collection = Backbone.Collection.extend({
  transport: 'socket',
  initialize: function(attrs, options) {
    if (options && !options.vendor_id)
      throw new Error('requires vendor_id `{vendor_id: \'id\'}`');

    this.retsly = Retsly.create();
    this.options = extend({urlBase: '/api/v1'}, options);
    this.vendor_id = options.vendor_id;
  },
  model: function(attrs, opts) {
    var col = opts.collection;
    return new col.Model(attrs, { collection: col, vendor_id: col.vendor_id });
  },
  url: function() {
    return [
        this.options.urlBase,
        this.fragment,
        this.vendor_id
      ].join('/')+'.json';
  }
});


/**
 * Retsly models
 */
var models = Retsly.Models = {};
models.Photo = Model.extend({fragment: 'photo'});
models.Agent = Model.extend({fragment: 'agent'});
models.Office = Model.extend({fragment: 'office'});
models.Listing = Model.extend({fragment: 'listing'});
models.Geography = Model.extend({fragment: 'geography'});

/**
* Retsly Collections
*/
var collections = Retsly.Collections = {};
collections.Agents = Collection.extend({fragment: 'agent', Model: models.Agent});
collections.Offices = Collection.extend({fragment: 'office', Model: models.Office});
collections.Listings = Collection.extend({fragment: 'listing', Model: models.Listing});
collections.Geographies = Collection.extend({fragment: 'geography', Model: models.Geography});

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
    jqXHR.setRequestHeader('Authorization', 'Bearer '+retsly.token);
  };
  Backbone.origAjax(request);
};

Backbone.getSyncMethod = function(model) {
  if(model.transport == 'socket' || (model.collection && model.collection.transport == 'socket')) {
    return Backbone.socket;
  }
  return Backbone.ajaxSync;
};

Backbone.sync = function(method, model, options) {
  return Backbone.getSyncMethod(model).apply(this, [method, model, options]);
};

/* Main socket hack for rets.ly over socket.io */

Backbone.socket = function(method, model, options) {
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

        if(res.bundle[0] && typeof res.bundle[0]._id !== 'undefined' && options.url.indexOf('photos') === -1) {

          debug('--> subscribe:put '+options.url, options.query || {});
          debug('--> subscribe:delete '+options.url, options.query || {});

          each(res.bundle, function(item){
            model.retsly.subscribe('put', options.url+'/'+item._id, {}, function(res) {
              //TODO: Figure out why each listing gets fired here
              if(res.id !== item._id) return;
              debug('<-- subscribe:put '+options.url, res);
              if(typeof model.get(res.id) === "undefined"){
                if(typeof model.add === 'function') model.add(res.bundle);
              } else {
                model.get(res.id).set(res.bundle);
                model.trigger('change', model.get(res.id), options, res);
              }
            });
            model.retsly.subscribe('delete', options.url+'/'+item._id, {}, function(res) {
              debug('<-- subscribe:delete '+options.url, res);
              if(typeof model.get(res.id) !== "undefined"){
                model.remove(res.bundle);
              }
            });
          });

          debug('--> subscribe:post '+options.url, options.query || {});
          model.retsly.subscribe('post', options.url, {}, function(res) {
            debug('<-- subscribe:post '+options.url, res);
            if(typeof model.get(res.id) === "undefined"){
              if(typeof model.add === 'function') model.add(res.bundle);
            } else {
              model.get(res.id).set(res.bundle);
              model.trigger('change', model.get(res.id), options, res);
            }
          });

        }

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
