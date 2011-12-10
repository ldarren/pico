var mongo = require('mongodb');

var mdb = exports;

var
  HOST = 'localhost',
  PORT = 27017,
  DB_NAME = 'test',
  TBL_NAME = 'test_insert';

var db = new mdb.DB(DB_NAME, new mdb.Server(HOST, PORT, {}),
  test = function(err, coll){
    Collection.insert({a:2}, function(err, docs){
      collection.count(function(err, docs){
        test.assertEquals(1, count);
      });

      // Locate all the entries using find
      collection.find().toArray(function(err, results){
        test.assertEquels(1, results.length);
        test.assertTrue(result.a === 2);

        // Lets close the db
        db.close();
      });
    });
  });

db.open(function(err, p_client){
  p_client.collection(TBL_NAME, test);
});
