//Simplify Web client helper implementation.
//Created by Semibold Mammoth in 2012.

//Simplify constructor takes no arguments
var Simplify = function()
{
	/* Internal websockets routines */

	//Storing our webscoket reference
	var connection = null, connection_polling_timer = null, callbacks = {}, offline_cache = {};

	//This methods looks for running instance of Simplify server and connects to it in case
	var internal_connect = function()
	{
		connection = new WebSocket("wss://localhost.tape.im:25984/");

		//Stopping polling when connected
		connection.onopen = function()
		{
			console.log("Connected to Simplify. Flushing cache. So it goes.");
			clearTimeout(connection_polling_timer);
			internal_flush_offline_cache();
		}

		//On closed connection trying to restore our polling
		connection.onclose = function()
		{
			delete connection;
			connection = null;
			clearTimeout(connection_polling_timer);
			connection_polling_timer = setTimeout(internal_connect, 4000);
		}

		//Polling again on error
		connection.onerror = function()
		{
			delete connection;
			connection = null;
			clearTimeout(connection_polling_timer);
			connection_polling_timer = setTimeout(internal_connect, 4000);
		}

		//Receiving messages
		connection.onmessage = function(message)
		{
			internal_deliver_message(message.data);
		}
	}	

	//Sending message to the server with JSON
	var internal_send = function(name, data)
	{
		//Caching everything important even if we are connected
		//We should be able to restore everything if Simplify is relaunched
		offline_cache[name.toString()] = data;

		//Only sending data if connection has been opened earlier
		if (connection == null || connection.readyState != WebSocket.OPEN) 
		{
			return;
		}

		//Should we send only message title or message title with some body?
		if (data == null)
		{
			data = {"__simplify_message_name__" : name};
		}
		else
		{
			data["__simplify_message_name__"] = name;
		}

		//Attaching important for server information regarding current client
		data["__simplify_message_client_identifier__"] = location.host;

		//Sending everything as a JSON string
 		connection.send(JSON.stringify(data));
	}

	//Sending offline cache when connected for the first time
	var internal_flush_offline_cache = function()
	{
		//Firstly we should set current player
		//This have to be sent before any other commands
		if (offline_cache[Simplify.MESSAGE_PLAYER_START.toString()] != null)
		{
			internal_send(Simplify.MESSAGE_PLAYER_START, offline_cache[Simplify.MESSAGE_PLAYER_START.toString()]);
		}

		//Sending stored data
		for (var key in offline_cache)
		{
			if (offline_cache.hasOwnProperty(key) && key != Simplify.MESSAGE_PLAYER_START.toString())
			{
				console.log("Restoring '" + key + "' from cache.");
				internal_send(parseInt(key), offline_cache[key]);
			}
		}

		//Clearing cache
		//offline_cache = {};
	}

	//Delivering message to its recipients
	var internal_deliver_message = function(raw_message)
	{
		try
		{
			//Parsing JSON message
			var message = JSON.parse(raw_message);

			//Extracting message title
			var message_title = message["__simplify_message_name__"];

			//It should always be presented
			if (message_title == null) return;

			//Removing it from the message body
			delete message["__simplify_message_name__"];

			//Extracting our callbacks
			var callbacks_list = callbacks[message_title];

			//They should be presented in order to process
			if (typeof callbacks_list == "undefined") return;

			//Despatching our message to every callback
			for (var i = 0; i < callbacks_list.length; i++)
			{
				callbacks_list[i](message);
			}
		}
		catch(error)
		{

		}
	}

	//Binding callback to some event
	var internal_bind_event = function(name, callback)
	{
		callbacks[name] = callbacks[name] || [];
		callbacks[name].push(callback);
	}


	/* Initial setup */

	//Connection polling 
	//This will check if Simplify is running 
	//If it founds Simplify, it connects to it and shuts down polling
	internal_connect();

	/* Public enumerations */

	//Playback state enumeration
	Simplify.PLAYBACK_STATE_PLAYING = "0";
	Simplify.PLAYBACK_STATE_PAUSED  = "1";
	Simplify.PLAYBACK_STATE_STOPPED = "3";

	//Outgoing events enumeration
	Simplify.MESSAGE_PLAYER_START			  		= "1";
	Simplify.MESSAGE_PLAYER_END				  	= "2";
	Simplify.MESSAGE_CHANGE_PLAYBACK_STATE 	= "3";
	Simplify.MESSAGE_CHANGE_TRACK      			= "4";
	Simplify.MESSAGE_CHANGE_ARTWORK 				= "5";
	Simplify.MESSAGE_CHANGE_TRACK_POSITION		= "6";
	Simplify.MESSAGE_CHANGE_VOLUME				= "7";

	//Incoming events enumeration
	Simplify.MESSAGE_DID_SELECT_PREVIOUS_TRACK 	= "100";
	Simplify.MESSAGE_DID_SELECT_NEXT_TRACK 		= "101";
	Simplify.MESSAGE_DID_CHANGE_PLAYBACK_STATE	= "102";
	Simplify.MESSAGE_DID_CHANGE_VOLUME				= "103";
	Simplify.MESSAGE_DID_CHANGE_TRACK_POSITION	= "104";
	Simplify.MESSAGE_DID_REQUEST_GOD					= "105";
	Simplify.MESSAGE_DID_SERVER_SHUTDOWN			= "106";

	//Incoming requests enumeration
	Simplify.MESSAGE_REQUEST_VOLUME				= "300";
	Simplify.MESSAGE_REQUEST_TRACK_POSITION 	= "301";

	/* External API: setting Simplify properties */

	//Notifies about the current player title
	this.setCurrentPlayer = function(name)
	{
		internal_bind_event(Simplify.MESSAGE_DID_REQUEST_GOD, function() { internal_flush_offline_cache(); });
		internal_send(Simplify.MESSAGE_PLAYER_START, {"name" : name, "uri" : location.hostname});
	}

	//Current player was closed 
	//Use this method to tell Simplify that current player was stopped (for example, when tab with player closed)
	this.closeCurrentPlayer = function()
	{
		internal_send(Simplify.MESSAGE_PLAYER_END);
		connection.close();
	}

	//Notifies Simplify about changed playback state
	//You must use one of the states defined above or their numeric equivalents
	this.setNewPlaybackState = function(state)
	{
		internal_send(Simplify.MESSAGE_CHANGE_PLAYBACK_STATE, {"state" : state});
	}

	//Playback was paused
	this.setPlaybackPaused = function()
	{
		this.setNewPlaybackState(Simplify.PLAYBACK_STATE_PAUSED);
	}

	//Playback was resumed, now playing
	this.setPlaybackPlaying = function()
	{
		this.setNewPlaybackState(Simplify.PLAYBACK_STATE_PLAYING);
	}

	//Playback was stopped, nothing to do, only burn in hell
	this.setPlaybackStopped = function()
	{
		this.setNewPlaybackState(Simplify.PLAYBACK_STATE_STOPPED);
	}

	//Changes track to the specified one with specified attributes
	//You should provide 'author', 'album', 'title', 'length' and 'uri' of track
	//All attributes except uri are mandatory
	//The track length must be provided in seconds
	//You can also provide server with useful information regarding features of current player
	//Supply 'features' dictionary with property 'disable_track_seeking' to disable track seeking,
	//'disable_previous_track' to disable previous track, 'disable_next_track' to disable next track
	this.setCurrentTrack = function(track)
	{
		internal_send(Simplify.MESSAGE_CHANGE_TRACK, track);
	}

	//Sets artwork link 
	//The link should be in a proper URL format
	//You can supply nil and Simplify will try to find artwork on its own 
	this.setCurrentArtwork = function(uri)
	{
		if (uri == null) uri = "urn:simplify";
		internal_send(Simplify.MESSAGE_CHANGE_ARTWORK, {"uri" : uri});
	}

	/* External API: client events that can be received from Simplify */
	/*
		List of available events without supplied arguments:
		
		MESSAGE_DID_SELECT_PREVIOUS_TRACK	- track changed to previous one
		MESSAGE_DID_SELECT_NEXT_TRACK			- track changed to next one
		MESSAGE_DID_CHANGE_PLAYBACK_STATE	- playback state changed (use 'state' key to get new state)

		List of available events with arguments:

		MESSAGE_DID_CHANGE_VOLUME				- volume changed (use 'amount' key to retrieve new volume)
		MESSAGE_DID_CHANGE_TRACK_POSITION	- position changed (use 'amount' key to retrieve new position)

	*/

	//Subscribing to various events that can be received
	//If you want to do everything by yourself, use this chainable method
	//If you do not want, we provide a set of handful methods
	this.bind = function(name, callback)
	{
		internal_bind_event(name, callback);
		return this;
	}

	//Special event from server: requested current volume
	//You should provide a callback function that will return a value of current volume
	this.bindToVolumeRequest = function(callback)
	{
		if (typeof callback == "undefined") return;

		//Binding to our message
		this.bind(Simplify.MESSAGE_REQUEST_VOLUME, function(message)
		{
			//We should not modify our message (it contains important values for response handling)
			message["value"] = callback();

			//Sending outgoing message with response
			internal_send(Simplify.MESSAGE_REQUEST_VOLUME, message);
		})

		return this;
	}

	//Special event from server: requested current track position
	this.bindToTrackPositionRequest = function(callback)
	{
		if (typeof callback == "undefined") return;

		//Binding to our message
		this.bind(Simplify.MESSAGE_REQUEST_TRACK_POSITION, function(message)
		{
			//We should not modify our message (it contains important values for response handling)
			message["value"] = callback();

			//Sending outgoing message with response
			internal_send(Simplify.MESSAGE_REQUEST_TRACK_POSITION, message);
		})

		return this;
	}

}
