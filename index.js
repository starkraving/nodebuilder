var fs = require('fs');

module.exports = function(req, resp, next) {
	// display the properties form to define the route
	if ( 'POST' !== req.method || !req.body.nb_properties ) {
		resp.contentType('text/html');
		resp.end('<form action="" method="post" enctype="application/x-www-form-urlencoded">'
			+'<input type="hidden" name="nb_method" value="'+req.method.toLowerCase()+'">'
			+'<label for="nb_properties">Route data:<br></label>'
			+'<textarea name="nb_properties" cols="80" rows="20">'
			+'{\n"description":"",\n"exits":[\n{"method":"get","text":"","path":""}\n]}</textarea><br>'
			+'<input type="submit" value="Continue"></form>');
	} else {
		// collect the route properties
		var vText;
		var rPath = req.originalUrl.split('?')[0].split('/');
		var vFile = rPath.join('_').replace(/[:\?]/g, '');
		var vRedirect = false;
		var rController = rPath.shift();
		var rMethod = req.body.nb_method;
		var rProperties = JSON.parse(req.body.nb_properties);
		var rText = '/**\n *'+rProperties.description+'\n */\n'
		if ( rController == '' ) {
			rController = rPath.shift();
		}
		if ( vFile.indexOf('_') === 0 ) {
			vFile = vFile.substr(1);
		}
		var fMode = 0o766;
		rPath = ( rPath.length > 0 ) ? '/'+rPath.join('/') : '';

		// generate the view code
		var vTitle = rPath.split('/').join(' ');
		if ( rMethod == 'get' ) {
			vText = 'extends layout\n\nblock content\n\th2 '+vTitle+'\n\tp '+rProperties.description;
			if ( rProperties.exits.length > 0 ) {
				var linkText = '';
				var formText = '';
				var menuText = '';
				for ( var x in rProperties.exits ) {
					var exit = rProperties.exits[x];
					switch ( exit.method ) {
						case 'post' :
							formText += '\n\t\tform(action="'+exit.path+'", method="post")'
										+ '\n\t\t\tbutton(type="submit") '+exit.text;
							break;
						case 'global' :
							menuText += '\n\t\t\tli\n\t\t\t\ta(href="'+exit.path+'") '+exit.text;
							break;
						case 'redirect' :
							vRedirect = true;
							break;
						default :
							linkText += '\n\t\tli\n\t\t\ta(href="'+exit.path+'") '+exit.text;
							break;
					}
				}
				vText += formText;
				if ( linkText.length > 0 ) {
					vText += '\n\tul'+linkText;
				}
			}
			if ( !vRedirect ) {
				// write the view files to disk
				fs.mkdir('./views', fMode, function(err){
					if ( !err ) {
						// view folder doesn't exist so neither do the common files
						fs.writeFileSync('./views/layout.pug',
							'doctype html\nhtml\n\thead\n\t\ttitle #{title}\n\tbody\n\t\tinclude header\n\t\tblock content',
							{mode: {mode: fMode}});
						fs.writeFileSync('./views/header.pug',
							'header\n\tmenu\n\t\th4 Global Exits\n\t\tul',
							{mode: fMode});
					}
					fs.writeFile('./views/'+vFile+'.pug', vText, {mode: fMode});
					if ( menuText.length > 0 ) {
						var headerText = fs.readFileSync('./views/header.pug').toString();
						headerText += menuText;
						fs.writeFile('./views/header.pug', headerText, {mode: fMode});
					}
				});
			}
		}


		// generate the route code
		rText += 'router.'+rMethod+'(\''+rPath+'\', function(req, res){\n\t';
		if ( rMethod == 'get' && !vRedirect ) {
			rText += 'res.render("'+vFile+'", {title: "'+vTitle+'"});';
		} else if ( rProperties.exits.length > 0 ) {
			rText += '\n\tres.redirect("'+rProperties.exits[0].path+'");'
		}
		rText += '\n});';

		// generate the controller code
		var cText = '';
		try {
			cText = fs.readFileSync('./controllers/'+rController+'.js').toString();
		} catch ( err ) {
			cText = 'var express = require(\'express\');\n'
					+'var router = express.Router();\n'
					+'\n\nmodule.exports = router;'
		}
		var cPos = cText.indexOf('module.exports = router;');
		cText = cText.substr(0,cPos)+rText+'\n\n'+cText.substr(cPos);

		// write the controller to disk
		try { fs.mkdirSync('./controllers', fMode); } catch( err ){} 
		try { fs.writeFileSync('./controllers/'+rController+'.js',cText, {mode: fMode}); } catch( err ){}


		// delay for 1 second while node restarts
		resp.contentType('text/html');
		resp.end('redirecting...<script type="text/javascript">setTimeout(function(){document.location.href="'+req.originalUrl+'";}, 1000);</script>');
		
	}
};