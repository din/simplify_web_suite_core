/*
 Building tasks for the whole project
*/

'use strict';

var gulp = require("gulp"),
 	fs = require('fs'),
	fsextra = require("fs-extra"),
	util = require("util"),
	path = require("path"),
	glob = require("glob"),
	underscore = require("underscore"),
	lineReader = require("line-reader"),
	ejs = require("ejs"),
	config = require("./config"),
	userOptions = require('minimist')(process.argv.slice(2));

//All players are stored here
var allPlayers = {},
	allHosts = {};

/* Loading information about all the available players */

function collectPlayersInfo()
{
	for (var filename in allPlayers)
	{
		if (allPlayers[filename]["hostname"] == null)
		{
			console.error("Warning. Skipping the player at '%s' because it doesn't contain a properly formatted set of headers.", 
						  filename);

			delete allPlayers[filename];
			continue;
		}

		allPlayers[filename].hostname.split(" ").forEach(function(hostname)
		{
			allHosts[hostname] = filename;
		});
	}
}

function loadPlayers(done)
{
	if (allPlayers.length > 0) return;

	glob(path.join(config.playersDir, "*.js"), function(er, files)
	{
		console.log("Found %d players. Starting processing them.", files.length);

		var processedFiles = 0;

		files.forEach(function(filename)
		{
			console.log("Processing '%s'...", filename);

			//Getting the existing params
			if (allPlayers[filename] == null) allPlayers[filename] = {};

			//Reading file line by line
			lineReader.eachLine(filename, function(line, last, callback)
			{
				line = line.trim();

				if (line.indexOf("//") === 0)
				{
					//Checking if we have components in this comment
					var components = line.substring(3).match(/@([a-z+_\-]+)\s*=\s*(.+)/i);

					if (components == null) 
					{
						callback();
						return;
					}

					//Getting the component name
					var name = components[1].trim().toLowerCase();
					var value = components[2].trim();

					//Saving the params
					allPlayers[filename][name] = value;

					callback();
				}
				else
				{
					callback(false);
				}

			}).then(function()
			{
				processedFiles++;
				if (processedFiles == files.length) 
				{
					collectPlayersInfo();
				
					console.log("All players have been processed.");
					done();
				}
			});
		});
	});
}

function buildBrowserFiles(browser, outputDir, built)
{
	//Logging the information about the current browser 
	console.log("Building a %s extension...", browser.charAt(0).toUpperCase() + browser.slice(1));
	console.log("Output will be saved to '%s'.", outputDir);

	//Creating the directory
	fsextra.ensureDirSync(outputDir);

	//Copying players and the core script to the destination directory
	console.log("Copying players and the core script...")

	fsextra.copySync(config.playersDir, path.join(outputDir, "data"));
	fsextra.copySync(config.simplifyCoreScript, path.join(outputDir, "data", path.basename(config.simplifyCoreScript)));

	//Rendering our templates from the skeleton
	var skeletonPath = path.join(config.skeletonDir, browser);

	//Preparing parameters for templating the skeleton
	var skeletonTemplate = { _ : underscore, 
							 path : path, 
							 util : util,
							 data : {
								 dataDir : "data",
								 coreScriptName : path.basename(config.simplifyCoreScript),
								 version : config.browsers[browser].version,
								 players : allPlayers,
								 hosts : allHosts
							 }
							}

	//Rendering the skeleton to the disk
	console.log("Creating extension files from the skeleton...");

	glob(path.join(skeletonPath, "*"), function(err, files)
	{
		for (var i = 0; i < files.length; i++)
		{
			var filename = files[i],
				outputFilename = path.join(outputDir, path.basename(filename));

			if (filename.indexOf(".template") !== -1)
			{
				console.log("Rendering template '%s'...", path.basename(filename));
				
				fs.writeFile(outputFilename.replace(".template", ""), 
							 ejs.render(String(fs.readFileSync(filename)), skeletonTemplate));
			}
			else
			{
				console.log("Copying file '%s'...", path.basename(filename));
				fsextra.copySync(filename, outputFilename);
			}
		}

		console.log("Finished creating the %s extension.", browser.charAt(0).toUpperCase() + browser.slice(1));

		built();
	});

}

/* Publicly available exported gulp tasks */

gulp.task("build", function(done)
{
	//Getting the list of all browsers names
	var availableBrowsers = Object.keys(config.browsers);

	//Filtering the list on '--browser=name' option
	if (userOptions["browser"] != null)
	{
		availableBrowsers = [userOptions["browser"]];
	}

	//Numbers of all browsers and browsers already processed
	var processedBrowsers = 0, totalBrowsers = availableBrowsers.length;

	//Checking if we need to clean firstly when '--clean' is supplied
	if (userOptions["clean"] != null)
	{
		console.log("Cleaning the build output directory...")
		fsextra.emptyDirSync(config.buildDir);
	}
	else
	{
		console.log("Build output directory will not be cleaned.")
	}

	//Callback method
	var built = function()
	{
		if (++processedBrowsers == totalBrowsers)
		{
			console.log("All done.")
			done();
		}
	}

	availableBrowsers.forEach(function(browser)
	{
		var outputDir = path.join(config.buildDir, config.browsers[browser].name);
		buildBrowserFiles(browser, outputDir, built);
	});
});

gulp.task("clean", function(done)
{
	console.log("Cleaning the build output directory...")
	fsextra.emptyDirSync(config.buildDir);
	done();
})

gulp.task("default", gulp.series(loadPlayers, "build"), function()
{
	//Intentionally empty

});

gulp.task("watch", function()
{
	console.log("Watching source extension files for changes...");

	var watcher = gulp.watch([path.join(config.skeletonDir, "**", "*.*"), 
							  config.simplifyCoreScript, 
							  path.join(config.playersDir, "*.js")], 
							  gulp.series(loadPlayers, "build"));

	watcher.on("change", function(event)
	{
		console.log("Rebuilding extensions...");
	});
})




