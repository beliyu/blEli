_ = require('lodash');

module.exports = function(Post) {
    Post.beforeRemote('create', function(context, user, next) {
        context.args.data.datCre = Date.now();
        context.args.data.ownerId = context.req.accessToken.userId;
        next();
    });
    Post.beforeRemote('prototype.updateAttributes', function(context, user, next) {
        context.args.data.datMod = Date.now();
        next();
    });
    Post.beforeRemote('upsert', function(context, user, next) {
        context.args.data.datMod = Date.now();
        next();
    });

  // new Posts - datCre >= last visit
  Post.newP = function(qdatCre, cb) {
    Post.find({
      "where":{"datCre":{"gte":qdatCre}},
      "include":["theme","group", "user"]
    }, function(err, po){
      if (err) return cb(err);

     let pos0 = _.orderBy(po, ["groupId", "themeId", "id"]);
     let gro=[], grId=0, thId=0, gri=-1, thi=-1;
 
     _.forEach(pos0, (value)=>{
        if(value.groupId != grId) {
            gro.push(value.group());
            gri++; thi=-1;
            grId = value.groupId;
            gro[gri].the=[];
        }
        if(value.themeId != thId) {
            gro[gri].the.push(value.theme());
            thi++;
            thId = value.themeId;
            gro[gri].the[thi].post=[];
        }
          gro[gri].the[thi].post
            .push({"id":value.id,
                    "body":value.body,  
                    "datCre":value.datCre,
                    "datMod":value.datMod,
                    "groupId":value.groupId,
                    "themeId":value.themeId,
                    "user":value.user()
            });
     })
        cb(err, gro)
  })};
  Post.remoteMethod('newP', {
    accepts: [
      {arg: 'qdatCre', type: 'date'}
    ],
    description: "Find all new Posts instances from the data sorce.",
    returns: {arg: 'news', type: 'array'},
    http: {path:'/newP', verb: 'get'}
  });

};
