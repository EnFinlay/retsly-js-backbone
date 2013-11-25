# retsly-js-backbone

Use [Retsly](https://rets.ly/) with Backbone.

## Install

Install with [component](https://github.com/component/component):

    $ component install retsly/retsly-js-backbone

TODO non-component usage

## Usage

    var Retsly = require('retsly-backbone')
    Retsly.create('CLIENT_ID');

    var listing = new Retsly.Models.Listing({_id: id, mls_id: mls});

    listing.fetch({success: function (listing) {
      // do something with listing
    }});
