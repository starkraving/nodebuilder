# nodebuilder
Node package for rapid ExpressJS routing buildout

Use this package when first building out the routes for your ExpressJS app. At the moment this package will create controller files that contain routes for GET and POST, but not PUSH and DELETE, so it's not yet suitable for API development. 

When loaded into your app.js it will do the following:

* On any "missing" route (404) it will display a form allowing you to describe the route and define any of its exits, including the exit method ("get", "post" or "redirect").
* Once submitted it will create a controller file if needed, then create a stubbed route.
* If the defined exits are of type "global" it will create links in a global nav file that is included in every page.
* If the defined exits are of type "get" it will create a view file with links to those exits.
* If the defined exits are of type "post" it will create a view file with a form that submits to that exit.
* If the defined exit is of type "redirect", it will leave out the view file and write a "resp.redirect()" into the route instead.

It works with some basic assumptions:

* It will create controllers and collect routes based on the first token of the URI, so "/products/search" and "/products/:id" would both be methods in the "products" controller. Therefore, the routes you describe and the exits you define have to have at least 2 tokens in their URIs.
* It will create .pug view files, so you need to have the "pug" package installed in your project.

This package works best when you can automatically load in your changes, so I've found that using an autoloader for controller files, along with a gulp task watching for file changes, really speeds up the development process when using this package. Having these two automation helpers allows the developer to point their browser to a URI they'd like to define, then just click on links and submit forms as they author them in order to completely define the project skeleton.

Here's some code samples that illustrate these ideas:

app.js:

```javascript
// dependencies
var express      = require('express'),
	path         = require('path'),
	app          = express(),
	fs           = require('fs'),
	session      = require('express-session'),
	bodyParser   = require('body-parser'),
	pug          = require('pug');

// environment variables
app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// dynamically include routes (Controller)
fs.readdirSync('./controllers').forEach(function (file) {
	if(file.substr(-3) == '.js') {
		var fc = file.replace('.js', '');
		app.use('/'+fc, require('./controllers/' + file));
	}
});

// nodebuilder will handle any undefined routes
app.use(require('nodebuilder'));

app.listen(process.env.PORT, function(){
  console.log('Express server listening on port ' + process.env.PORT);
});
```

gulpfile.js:

```javascript
var gulp = require('gulp'),
    spawn = require('child_process').spawn,
    node;

gulp.task('server', function() {
  if (node) node.kill()
  node = spawn('node', ['app.js'], {stdio: 'inherit'})
  node.on('close', function (code) {
    if (code === 8) {
      gulp.log('Error detected, waiting for changes...');
    }
  });
});

gulp.task('nodebuilder', function() {
  gulp.run('server')

  gulp.watch(['./app.js', './nodebuilder.js', './controllers/*.js'], function() {
    gulp.run('server')
  });

});

process.on('exit', function() {
    if (node) node.kill()
});

```

# About the author
Mike Ritchie has been developing web applications for over a decade, and is largely known for the "FuseBuilder" app, which allowed PHP and ColdFusion developers to rapidly describe their own web applications using the "Fusebox" framework and methodology. FuseBuilder was quite a bit more advanced in that it not only created a wireframe of the developer's app, it allowed the developer to actually create working forms and layouts in the view, along with model files with working SQL and controllers with actual business logic. Nodebuilder is an offshoot of this concept applied to the Node/Express paradym. It's hoped that one day Nodebuilder will have much of the same power.
