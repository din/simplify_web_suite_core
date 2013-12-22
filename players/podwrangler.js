(function() {	
	var jplayer = $('#jquery_jplayer_1');
	if (window.top == window && jplayer.length === 1) {
	    window.addEventListener('load', function() {
			var simplify = new Simplify();

			//Handling incoming/outcoming events here

			window.addEventListener("unload", function()
			{
			    simplify.closeCurrentPlayer();
			});     

			simplify.setCurrentPlayer("Pod Wrangler");
			simplify.setCurrentArtwork($('.episode img').attr('src'));

			simplify.bind(Simplify.MESSAGE_DID_CHANGE_PLAYBACK_STATE, function(data)
			{
			    if (data["state"] == Simplify.PLAYBACK_STATE_PLAYING) { 
			    	/* Play current song */ 
			    	jplayer.jPlayer("play")
			    	simplify.setCurrentTrack({ 
						author: "",
						title: $('h3').text().replace(/[^a-zA-Z\d\s:]/g, ''),
						length: jplayer.data("jPlayer").status.duration,
						features : {
						    "disable_previous_track" : true,        //Disables selection of previous track
						    "disable_next_track" : true             //Disables selection of next track
					    }
					});
				}; 
			    if (data["state"] == Simplify.PLAYBACK_STATE_PAUSED) { 
			    	/* Pause current song */ 
			    	jplayer.jPlayer("pause")
				};
			});
			simplify.bindToVolumeRequest(function()
			{
			    //Extract volume and return its amount as an integer
			    return 100 * jplayer.data("jPlayer").options.volume;
			})
			simplify.bindToTrackPositionRequest(function()
			{
			    //Extract track position and return its amount in seconds
			    return parseInt(jplayer.data("jPlayer").status.currentTime);
			})

			simplify.bind(Simplify.MESSAGE_DID_CHANGE_VOLUME, function(data)
			{
			    //Change volume to data["amount"]
			    jplayer.jPlayer("volume", data.amount/100);
			});

			simplify.bind(Simplify.MESSAGE_DID_CHANGE_TRACK_POSITION, function(data)
			{
			    //Seek track to data["amount"] seconds
			    if (jplayer.data("jPlayer").status.paused) {
			    	jplayer.jPlayer("pause", data.amount);
			    } else {
			    	jplayer.jPlayer("play", data.amount);
			    }
			});
			simplify.setNewPlaybackState(Simplify.PLAYBACK_STATE_PAUSED);

			// Bind browser play event to tell simplify about it.
			jplayer.bind($.jPlayer.event.play,function(e){
				simplify.setNewPlaybackState(Simplify.PLAYBACK_STATE_PLAYING);
				simplify.setCurrentTrack({ 
						author: "",
						title: $('h3').text().replace(/[^a-zA-Z\d\s:]/g, ''),
						length: jplayer.data("jPlayer").status.duration,
						features : {
						    "disable_previous_track" : true,        //Disables selection of previous track
						    "disable_next_track" : true             //Disables selection of next track
					    }
					});
			});

			// Bind browser pause event to tell simplify about it.
			jplayer.bind($.jPlayer.event.pause,function(e){
				simplify.setNewPlaybackState(Simplify.PLAYBACK_STATE_PAUSED);
			});
		});
	}
})();