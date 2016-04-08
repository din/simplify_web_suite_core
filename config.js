/* Various properties of the current Simplify Web Suite build */

module.exports = {

	//Version of the extension for both browsers
	browsers : {

		chrome : {
			name : "Simplify.chromeextension",
			version : "1.7.0",
		},

		safari : {
			name : "Simplify.safariextension",
			version : "1.7.0",
		}

	},

	//Output build directory
	buildDir : "./build",

	//Players directory contains all the players
	playersDir : "./players",

	//Skeleton directory
	skeletonDir : "./skeleton",

	//Simplify engine script
	simplifyCoreScript : "./simplify.js"

}
