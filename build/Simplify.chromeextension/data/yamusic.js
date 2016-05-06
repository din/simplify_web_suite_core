// Yandex.music
// @hostname = music.yandex.ru

if (window.top == window)
{
	//Setting up current player and listeners on page load
	var setupSimpify = function() {
		if (typeof externalAPI == "undefined") {
			console.log("Waiting for audio player to be available...");
			setTimeout(setupSimpify, 3000);
			return;
		}

		//Creating Simplify object
		var simplify = new Simplify();

		//Extracting information about track from Vkontakte player
		var get_current_track = function() {
			if (typeof externalAPI == "undefined" ) return null;
			return {	"author" : externalAPI.getCurrentTrack()["artists"][0].title,
						"title"  : externalAPI.getCurrentTrack().title,
						"album"  : externalAPI.getCurrentTrack()["album"].title,
						"length" : parseInt(externalAPI.getCurrentTrack().duration),
						"uri"	 : "http://music.yandex.ru" + externalAPI.getCurrentTrack().link,
						"id"	 : externalAPI.getCurrentTrack().link
					};
		}

		//Setting up Simplify player description
		//This should be always done before any other actions
		simplify.setCurrentPlayer("Yandex.Music");

		//Hooking track switch inside Vkontakte
		window.operateFirstCall = true, window.operateFirstCallChecker = null, window.lastTrackID = null;


		//Function to notify Simplify about changed track
		var notify_simplify = function() {
			//Extracting current track from audio player
			var current_track = get_current_track();
			if (current_track == null) return;

			//If it exists and doesn't equal to the previous one, updating Simplify
			if (current_track["id"] != window.lastTrackID)
			{
				//Sending various notifications
				simplify.setCurrentTrack(current_track);
				simplify.setCurrentArtwork("https://" + externalAPI.getCurrentTrack().cover.replace("%%", "400x400"));
				if (externalAPI.isPlaying() == true) simplify.setPlaybackPlaying();

				//Storing last track identifier
				window.lastTrackID = current_track["id"];
			}
		};

		var updatingSimplify = function() {
			if (typeof externalAPI.getProgress().duration == "number") {
				notify_simplify();
			}
			else {
				setTimeout(updatingSimplify, 500);
				return;
			}
		};

		externalAPI.on("track", function() {
			updatingSimplify();
		});

		externalAPI.on("state", function() {
			if (externalAPI.isPlaying() == false) {
				simplify.setPlaybackPaused();
			}
			else {
				simplify.setPlaybackPlaying();
			}
		});

		//Not a first call? Simply notifying
		if (window.operateFirstCall == false) {
			notify_simplify();
		}
		else {
			//First time player creation.
			operateFirstCallChecker = setInterval(function() {
				if(typeof externalAPI.getProgress().duration == "number") {
					clearInterval(operateFirstCallChecker);
					updatingSimplify();
				}
			}, 500);
			window.operateFirstCall = false;
		}


		// Handling basic events from Simplify server
		simplify.bindToVolumeRequest(function()
		{
			if (typeof externalAPI == "undefined") return 0;
			return externalAPI.getVolume()*100;

		}).bindToTrackPositionRequest(function()
		{

			if (typeof externalAPI.getProgress().position != "number") return 0;
			return parseInt(externalAPI.getProgress().position);

		}).bind(Simplify.MESSAGE_DID_SELECT_PREVIOUS_TRACK, function()
		{

			if (typeof externalAPI == "undefined") return;
			externalAPI.prev();

		}).bind(Simplify.MESSAGE_DID_SELECT_NEXT_TRACK, function()
		{

			if (typeof externalAPI == "undefined") return;
			externalAPI.next();

		}).bind(Simplify.MESSAGE_DID_CHANGE_PLAYBACK_STATE, function(data)
		{

			if (data["state"] == null || typeof externalAPI == "undefined") return;
			if (data["state"] == Simplify.PLAYBACK_STATE_PLAYING) externalAPI.togglePause();
			if (data["state"] == Simplify.PLAYBACK_STATE_PAUSED) externalAPI.togglePause();

		}).bind(Simplify.MESSAGE_DID_CHANGE_VOLUME, function(data)
		{

			if (data["amount"] == null || typeof externalAPI == "undefined") return;
			externalAPI.setVolume(data["amount"]/100);

		}).bind(Simplify.MESSAGE_DID_CHANGE_TRACK_POSITION, function(data)
		{

			if (data["amount"] == null || typeof externalAPI == "undefined") return;
			externalAPI.setPosition(parseFloat(data["amount"]));

		});

		//Subscribing to unload event to clear our player
		window.addEventListener("unload", function()
		{
			simplify.closeCurrentPlayer();
		});
	};

	window.addEventListener("load", setupSimpify);
}
