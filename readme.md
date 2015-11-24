!!Not actually working yet!!
===
Currently (11/25/15) being developed to some extent. May not get all the features in, but who knows.

aws-site
===
design a site that you can deploy to aws via lambdas and s3

Example
---
```
var site = require('aws-site').create({
    namespace: 'whatever',
    bucketName: 'whatever', // default to namespace if not provided
    bucketRegion: 'us-west-2',
    lambdaRegion: 'us-west-2'
});
site.lambdas
.set('create-post', ['js-yaml'], function (event, context, site) {
    var yaml = require('js-yaml');
    var now = new Date();
    var newPost = {
        id: now.getTime(),
        message: event.message,
        date: now
    };
    site.lambdas.execute('list-posts', function (error, posts) {
        posts.push(newPost);
        site.putObject('posts.yaml', yaml.safeDump(posts), function (error) {
            if (error) return context.fail(error);
            context.succeed(newPost);
        });
    });
})
.set('list-posts', ['js-yaml'], function (event, context, site) {
    var yaml = require('js-yaml');
    site.getObject('posts.yaml', function (error, postsRaw) {
        var posts;
        try {
            posts = yaml.safeLoad(postsRaw);
        } catch (error) {
            return context.fail(error);
        }
        context.succeed(posts);
    })
})
.set('update-post', ['js-yaml'], function (event, context, site) {
    var yaml = require('js-yaml');
    site.lambdas.execute('list-posts', {}, function (error, posts) {
        if (error) return context.fail(error);
        var id = event.id;
        var post = posts.filter(function (post) {
            return post.id == id;
        })[0];
        if (!post) {
            return context.fail('No post with id "' + id + '"');
        }
        post.message = event.message;
        site.putObject('posts.yaml', yaml.safeDump(posts), function (error) {
            if (error) return context.fail(error);
            context.succeed(post);
        });
    });

});

site
.get('/', 'list-posts')
.post('/', 'create-post')
.put('/:id', 'update-post');
```

Deployment
---
```
aws-site deploy [-s stage][-d dry run]
```

site.lambdas
---
 - sets the namespaced name (site.namespace + '-' + lambda.name)
 - create the handler function, which will go at a known place

##Require statements (get-paths.js is implementation)

i have to find all of them in the function body.
If it's a node module, it must be installed (in the node_modules of the project).
If it's relative, then it has to be zipped up with all of it's requirements available as well, which means I'll be parsing a lot of files.

Example:
```
project_root
- index.js
- endpoints
    - creator.js
    - deleter.js
- shared
    - posts.js
    - users.js
- node_modules

so, if index.js has

    var creator = require('./endpoints/creator');

and creator has

    var posts = require('../shared/posts');

and shared/posts has no requires, i need a folder structure like this

- index.js
- endpoints
    - creator.js
- shared
    - posts.js
```

before i can actually do this part, though, i need to make the lambda function it's own file, like 'index.js', although it'll probably be like...<namespace>-<lambda-name>.js. Also have to do the whole exports.handler = <function>...and the site thing...
