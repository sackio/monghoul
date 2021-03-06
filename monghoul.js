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

  O = _.defaults(O || {}, {
    //express
      //port
    //mongodb
      //host
      //port
      //db
  });

  O = _.defaults(O || {}, {
    'host': 'http://localhost:' + O.port
  });

////////////////////////////////////////////////////////////////////////////////
////METHODS                                                                 ////
////////////////////////////////////////////////////////////////////////////////

  M['startMongodb'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'command': 'node'
    , 'express': O.express
    , 'mongodb': O.mongodb
    });
    a.o = _.defaults(a.o, {
      'args': ([
        './node_modules/mongro/lib/server.js'
      ].concat(_.map(a.o.express, function(v, k){
        return '--express.' + k + '=' + v;
      })).concat(_.map(a.o.mongodb, function(v, k){
        return '--mongodb.' + k + '=' + v;
      })))
    });

    Belt.get(self, '_mongodb.kill("SIGKILL")');

    self['_mongodb'] = CP.spawn(a.o.command, a.o.args);

    self._mongodb.stdout.on('data', function(d){
      if (d.match(/\/\/READY\/\//)){
        console.log('MONGRO SERVER STARTED ON PORT ' + a.o.express.port);
        return a.cb()
      }
      if (a.o.verbose) console.log('MONGRO SERVER - STDOUT: ' + JSON.stringify(d));
    });

    self._mongodb.stderr.on('data', function(d){
      if (a.o.verbose) console.log('MONGRO SERVER - STDERR: ' + JSON.stringify(d));
    });

    self._mongodb.on('exit', function(code){
      console.log('MONGRO Exited with Code: ' + code);
    });
  };

  M['_request'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this;
    a.o = _.defaults(a.o, {
      'page': Webpage.create()
    , 'host': O.host
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

      if (!err && Belt.get(gb, 'data.error')) err = new Error(gb.data.error);

      return a.cb(err, Belt.get(gb, 'data.data'));
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
