# Simplify Web Suite Core

This repository contains source code to interact with [Simplify](http://pxmates.com/factory/simplify) from one of web-browsers. You can find an overview of our protocol in `simplify.js`. All supported web-players are in the `players/` subdirectory.

## Building and working with extensions builds

*Important note (31-05-2015): the build system was significantly changed and it doesn't require two repositories anymore since the building process was revamped using [Node.js](https://nodejs.org) and [Gulp 4](http://gulpjs.com). The old repository can be found in the `old` branch and will no longer be maintained.*

### Directory structure

The repository contains files that are necessary to build extensions for Google Chrome and Safari. 

* `build/` contains the resulting directories with the production-ready extensions. You may not directly modify files in this directory, but instead you modify source files and use `gulp` to rebuild extensions again.

* `players/` contains sources for all the players that can be used by Simplify Web Suite Core. They will be automatically copied to the extension directories.

* `skeleton/` contains files and templates that are necessary to automatically create extensions. Files that have `template.` part in it are interpreted as `EJS` templates and processed accordingly. All other files are copied to the appropriate extension directory.

* `config.js` contains version configuration for every browses and directories names.

* `simplify.js` contains the core Simplify object that is used to be used on web-players pages.

* `gulpfile.js` contains the build system which automatically assembles all extensions.

### How to build

In order to build extensions, clone this repository and run `npm install` (make sure you have [Node.js](https://nodejs.org) installed).

When you installed all the necessary packages using the `npm install` command, you are ready to build extensions. Use the `npm run gulp` command which will build extensions to the `build/` directory. Every time you run `npm run gulp`, it will process source files (all files in `players/`, `simplify.js` and all files in `skeleton/`) and override files in the `build/` directory. Make sure you are not editing any files in the `build/` directory, because they will be overriden. Edit source files instead.

### Adding players

Create a new `.js` file in the `players/` directory with a header which contains a `@hostname` variable. All files in the `players/` directory must start with a single-line JavaScript comment `//`. 

If you want to create a file to support a player located at `http://theawesomeplayer.com/`, the header must contain the following value:

```
// My awesome player
// @hostname = theawesomeplayer.com
```

The `@hostname` variable is mandatory and must not be omitted. It may have several domains separated by a white-space:

```
// @hostname = helloworld.com helloworld.net helloworld.org
``` 

The header may or may not have any other content, but all the first lines in a file must start with `//`. Please see existing player implementations as an example.

After you added your player or changed its code, run `npm run gulp` to rebuild extensions.

### Build commands

* ```npm run gulp``` builds or rebuils all extension files.
* ```npm run gulp clean``` cleans the `build/` directory completely.
* ```npm run gulp watch``` rebuilds all extensions automatically every time you change source files (all files in `players/`, `simplify.js` and all files in `skeleton/`).

## Core API

The core class is a set of methods and properties to interact with desktop application (server). It implements basic client-server protocol on top of WebSockets connection. The connection itself is created and maintained by `Simplify` class. It also automatically reconnects if connection to server fails. 

Core API provides you with two types of methods. You can send various messages to server to notify it about some important event on client side. On the other hand, server can also send various messages to client, so Core API allows you to subscribe to incoming events to handle them appropriately. 

Note that you are not supposed to cache any data, like player name, track information, or artwork links. All cache is stored inside the core class. If WebSockets connection to server eventually fails, the client will restore everything when connection becomes available.  

### Initialization

You can set up client by instantiating `Simplify`:

```var simplify = new Simplify();```

### setCurrentPlayer(name)

Sends current player name to server. Call this method after you've created your own instance of `Simplify`. Supply player name as a string. Avoid long names.

### closeCurrentPlayer

Tells server that the current client is not active anymore. Usually you call this method when page unloads, like:

```
var simplify = new Simplify();

//Handling incoming/outcoming events here

window.addEventListener("unload", function()
{
	simplify.closeCurrentPlayer();
}); 	
```

### setNewPlaybackState(state)

Notifies server that the playback state should be changed. A `state` variable must be one of predefined constants:

```
Simplify.PLAYBACK_STATE_PLAYING
Simplify.PLAYBACK_STATE_PAUSED
Simplify.PLAYBACK_STATE_STOPPED
```

You can also use one of predefined methods to change playback state: `setPlaybackPaused`, `setPlaybackPlaying` and `setPlaybackStopped`.

### setCurrentTrack(track)

Sends information about current track to server. This method should be called when track change occurs. This method must not be called on playback state change. 

`track` is a dictionary of values. You fill it with all known information about the current track:

```
{
	"author" : track_author,		//Mandatory key
	"title"  : track_title, 		//Mandatory key
	"album"  : track_album,			//Can be omitted
	"length" : track_length,		//Mandatory key
	"uri"		: track_absolute_uri	//Can be omitted
}
```

Sometimes you also may need to tell server that current player doesn't support some features, like seeking tracks or selecting previous track. You can send this useful information by appending `features` key to the aforementioned dictionary:

```
{
   "author" : track_author,
   "title"  : track_title,
   "album"  : track_album,
   "length" : track_length,
   "features" : {
   	"disable_track_seeking" : true, 		//Disables seeking of current track
   	"disable_previous_track" : true,		//Disables selection of previous track
   	"disable_next_track" : true 			//Disables selection of next track
	}
}
```

You do not need to cache any information about track. The core class caches everything if necessary.

### setCurrentArtwork(uri)

Notifies server about artwork for the current track. You should supply either absolute URI to some artwork or `null` as an `uri` argument. If `null`, server will try to find artwork for this track by itself. 

### bindToVolumeRequest(callback)

Server may occassionaly request current player's volume. It must be returned as an integer (min. 0 and max. 100) from your `callback` method:

```
simplify.bindToVolumeRequest(function()
{
	//Extract volume and return its amount as an integer
})
```

### bindToTrackPositionRequest(callback)

Server may occassionaly request current player's track position. It must be returned as an integer representing current track position in seconds from `callback`:

```
simplify.bindToTrackPositionRequest(function()
{
	//Extract track position and return its amount in seconds
})
```

### bind(name, callback)

Adds new handler to specified event. The first argument `name` is one of predefined names of messages. The second argument `callback` is a function that will be called when event arrives. 

All events are sent by server as a reaction to any user actions in desktop application. For example, when user modifies volume inside Simplify.app, server sends `Simplify.MESSAGE_DID_CHANGE_VOLUME` to us, and we need to handle it appropriately. 

You are able to chain this command like this:

```
simplify.bind(Simplify.MESSAGE_DID_SELECT_PREVIOUS_TRACK, function()
{
	//Select previous track
}).bind(Simplify.MESSAGE_DID_SELECT_NEXT_TRACK, function()
{
	//Select next track
});
```

All message types are described below.

#### Simplify.MESSAGE_DID_SELECT_PREVIOUS_TRACK

Previous track should be selected.

#### Simplify.MESSAGE_DID_SELECT_NEXT_TRACK 

Next track should be selected.
		
#### Simplify.MESSAGE_DID_CHANGE_PLAYBACK_STATE 	

Playback state should be changed. Server pushes `data["state"]` with a desired state:

```
Simplify.PLAYBACK_STATE_PLAYING
Simplify.PLAYBACK_STATE_PAUSED
Simplify.PLAYBACK_STATE_STOPPED
```

Example of usage:

```
simplify.bind(Simplify.MESSAGE_DID_CHANGE_PLAYBACK_STATE, function(data)
{
	if (data["state"] == Simplify.PLAYBACK_STATE_PLAYING) { /* Play current song */ }; 
	if (data["state"] == Simplify.PLAYBACK_STATE_PAUSED) { /* Pause current song */ };
});
```

#### Simplify.MESSAGE_DID_CHANGE_VOLUME 				

Current volume of player should be changed. Use `data["amount"]` to retrieve new volume, which will be in an interval between 0 and 100.

Example of usage:

```
simplify.bind(Simplify.MESSAGE_DID_CHANGE_VOLUME, function(data)
{
	//Change volume to data["amount"]
});
```

#### Simplify.MESSAGE_DID_CHANGE_TRACK_POSITION

Current track position should be modified. Use `data["amount"]` to retrieve new position in seconds. 

Example of usage:

```
simplify.bind(Simplify.MESSAGE_DID_CHANGE_TRACK_POSITION, function(data)
{
	//Seek track to data["amount"] seconds
});
```

#### Simplify.MESSAGE_DID_SERVER_SHUTDOWN

Service message to notify client that server was shut down by user (Simplify.app was closed). You may want to subscribe to this event to release resources or shut down timeouts and/or intervals.


## Usage tips

You need to include `simplify.js` as a content-script to the web-page of interest before any other files. 

Subscribe to DOM loaded event and create an instance of `Simplify` object. The first and primary thing to do is to notify server about the current player by using `setCurrentPlayer` method. It should be called before any other methods. Set up all event listeners to handle incoming events and implement sending track information when track changes in the web player.  

Basic skeleton for handling players:

```
window.addEventListener("load", function()
{
	var simplify = new Simplify();
	
	simplify.setCurrentPlayer("My Favourite Player");

	//Handle incoming events and send track information here

	window.addEventListener("unload", function()
	{
		simplify.closeCurrentPlayer();
	}); 
});
```