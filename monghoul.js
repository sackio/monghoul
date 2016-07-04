/*
  Framework and tools for Phantomjs

  Webpage = require('webpage')
  System = require('system')
  Phantom = phantom
  CP = require('child_process')
  FS = require('fs')
  Server = require('webserver')

  requires:
  _
  Belt
  Moment
  Async
*/

var Monghoul = function(O){
  var M = {};

  O = O || {

  };

////////////////////////////////////////////////////////////////////////////////
////METHODS                                                                 ////
////////////////////////////////////////////////////////////////////////////////

  M['_request'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this;
    a.o = _.defaults(a.o, {
      'page': Webpage.create()
    , 'host': 'http://localhost:9354'
    , 'url': _.template('<%= host %>/db/<%= db %>/collection/<%= collection %>/method/<%= method %>.json')
      //db
      //collection
      //method
      //data
    });

    var gb ={};

    return Async.waterfall([
      function(cb){
        return a.o.page.open(a.o.url(a.o), {
          'operation': 'POST'
        , 'encoding': 'utf8'
        , 'headers': {
            'Content-Type': 'application/json'
          , 'Accept': 'application/json'
          }
        , 'data': Belt.stringify(a.o.data)
        }, Belt.cw(cb));
      }
    , function(cb){
        try {
          gb['data'] = Belt.parse(a.o.page.plainText);
          return cb();
        } catch(e) {
          return cb(new Error('error retrieving data'));
        }
      }
    ], function(err){
      Belt.get(a.o, 'page.close()');

      if (!err && Belt.get(gb, 'response.error')) err = new Error(gb.response.error);

      return a.cb(err, Belt.get(gb.response, 'data'));
    });
  };

  _.each([
    'find'
  , 'findOne'
  , 'findOneAndUpdate'
  , 'findOneAndReplace'
  , 'findOneAndRemove'
  , 'updateOne'
  , 'updateMany'
  , 'insertOne'
  , 'insertMany'
  , 'deleteOne'
  , 'deleteMany'
  , 'count'
  ], function(v){
    M[v] = function(options, callback){
      var a = Belt.argulint(arguments)
        , self = this;
      a.o = _.defaults(a.o, {
        //db
        //collection
        //more...
      });

      return self._request(_.extend({}, {
        'method': v
      , 'data': _.omit(a.o, [
          'db'
        , 'collection'
        , 'host'
        , 'url'
        , 'page'
        ])
      }, a.o), a.cb);
    };
  });

  return M;
};
