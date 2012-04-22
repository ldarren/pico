var 
util = require('util'),
hs = require('node-handlersocket'),
Model = function(readClient, writeClient){
  this.readClient = readClient;
  this.writeClient = writeClient;
};

Model.prototype.setup = function(db, tbl, idx, fields, cb){
    var me = this;
    this.db = db;
    this.tbl = tbl;
    this.idx = idx;
    this.fields = fields,
    rEmitter = me.readClient.emitter,
    wEmitter = me.writeClient.emitter;

    if (rEmitter){
        rEmitter.on('reconnect', function(){
            me.rreconnect(function(err){
                console.log('%s.%s:read reconnected [%s]',me.tbl,me.idx,util.inspect(err));
            });
        });
    }

    if (wEmitter){
        wEmitter.on('reconnect', function(){
            me.wreconnect(function(err){
                console.log('%s.%s:write reconnected [%s]',me.tbl,me.idx,util.inspect(err));
            });
        });
    }

    me.rreconnect(function(err){
        if (err) return cb(err);
        me.wreconnect(function(err){
            return cb(err);
        });
    });
}

Model.prototype.rreconnect = function(cb){
    var me = this,
    conn = me.readClient.conn;

    conn.openIndex(me.db, me.tbl, me.idx, me.fields, function(err, rindex){
        if (err) return cb(err);
        me.rindex = rindex;
        return cb(err);
    });
}

Model.prototype.wreconnect = function(cb){
    var me = this,
    conn = me.writeClient.conn;

    conn.openIndex(me.db, me.tbl, me.idx, me.fields, function(err, windex){
        if (err) return cb(err);
        me.windex = windex;
        return cb(err);
    });
}

Model.prototype.get = function(index, ops, cb){
    this.rindex.find('=', [index], ops, function(err, records){
        return cb(err, records);
    });
}

// TODO: in set is not working
Model.prototype.getSet = function(indexes, ops, cb){
    this.rindex.find('=', [hs.in(indexes)], ops, function(err, records){
        return cb(err, records);
    });
}

Model.prototype.create = function(values, cb){
    this.windex.insert(values, function(err, info){
        return cb(err, info);
    });
}

Model.prototype.replace = function(index, values, cb){
    this.windex.update('=', index, values, function(err, count){
        return cb(err, count);
    });
}

// save handlersocket output to json object
Model.prototype.saveRecords = function(o, v, info){
    var 
        k = this.fields,
        p = 0;

    if (!o) o = {};
    for(var i=0,j=k.length; i<j; ++i){
        p = parseInt(v[i]);
        o[k[i]] = p ? p : v[i];
    }
    return o;
}

module.exports = Model;

