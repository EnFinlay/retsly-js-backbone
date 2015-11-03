[![wercker status](https://app.wercker.com/status/c1c25d0ddf4917a14fd0de23e515fed6/m "wercker status")](https://app.wercker.com/project/bykey/c1c25d0ddf4917a14fd0de23e515fed6)

# retsly-js-backbone

Use [Retsly](https://rets.ly/) with Backbone.

## Install

Javascript
```sh
  npm install --save retsly-js-backbone
```

## Usage

Get a collection of listings

```javascript

  /**
   * Main.js
   */

  var Retsly = require('retsly-js-backbone')

  // Enter your credentials
  Retsly.create(<clientId>, <browserToken>);

  var collection = new Retsly.Collections.Listings({vendorID: <vendorID>});

  // Fetch collection
  collection.fetch({success: function (response) {

    // response is a collection of listing models
    // do something with response

    // Optional step - Fetch a specific model
    var firstListing = response.models[0];

    // Option 1: Enter an ID
    var listing = new Retsly.Models.Listing({_id: firstListing.get('id'), vendorID: <vendorID>});

    listing.fetch({success: function (item) {
      // do something with listing
      console.log(item);
    }});

    // Option 2: Call fetch directly on the model
    firstListing.fetch({success: function (item) {
      // do something with listing
      console.log(item);
    }});

  }});
```

To run in your browser:

```sh
  browserify main.js -o <srcName>.js
```

Include the the script in your header
```html
  <head>
    <script src="<srcName>.js"></script>
  </head>
```

## API
### Retsly.create( _clientId_, _browserToken_ )

Example
```js
  Retsly.create('asdfkjhgkl', '1234876590abc');
```

- {String} client_id
- {String} browser_token

### Retsly.Collections.#RESOURCE( { vendorID: _vendorID_ } )

Example
```js
  var collection = new Retsly.Collections.Listings({vendorID: 'test'});
```

##### #RESOURCE:
 - Listings
 - Agents
 - Offices
 - OpenHouses
 - Vendors
 - Parcels
 - Assessments
 - Transactions

- {String} vendorID
Sets the user tokens and ids

More info regarding Resources can be found in the [Retsly Documentation](https://rets.ly/docs/retsly/index.html#hero)

To Fetch is the same as the Backbone commands.

- collection.fetch(cb)

More info regarding backbone can be found from the [Backbone Documentation](http://backbonejs.org/)

## Repo Owner

[Jason Wan](http://github.com/jkhwan)

## License

(The MIT License)

Copyright (c) 2013 Retsly Software Inc <support@rets.ly>

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the 'Software'),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
