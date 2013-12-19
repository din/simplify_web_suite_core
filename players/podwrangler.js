(function() {	
	if (window.top == window && $('#jquery_jplayer_1').length === 1) {
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
			    	$('#jquery_jplayer_1').jPlayer("play")
			    	simplify.setCurrentTrack({ 
						author: "",
						title: $('h3').text().replace(/[^a-zA-Z\d\s:]/g, ''),
						length: $("#jquery_jplayer_1").data("jPlayer").status.duration,
						features : {
						    "disable_previous_track" : true,        //Disables selection of previous track
						    "disable_next_track" : true             //Disables selection of next track
					    }
					});
				}; 
			    if (data["state"] == Simplify.PLAYBACK_STATE_PAUSED) { 
			    	/* Pause current song */ 
			    	$('#jquery_jplayer_1').jPlayer("pause")
				};
			});
			simplify.bindToVolumeRequest(function()
			{
			    //Extract volume and return its amount as an integer
			    return 100 * $("#jquery_jplayer_1").data("jPlayer").options.volume;
			})
			simplify.bindToTrackPositionRequest(function()
			{
			    //Extract track position and return its amount in seconds
			    return parseInt($("#jquery_jplayer_1").data("jPlayer").status.currentTime);
			})

			simplify.bind(Simplify.MESSAGE_DID_CHANGE_VOLUME, function(data)
			{
			    //Change volume to data["amount"]
			    $('#jquery_jplayer_1').jPlayer("volume", data.amount/100);
			});

			simplify.bind(Simplify.MESSAGE_DID_CHANGE_TRACK_POSITION, function(data)
			{
			    //Seek track to data["amount"] seconds
			    if ($("#jquery_jplayer_1").data("jPlayer").status.paused) {
			    	$('#jquery_jplayer_1').jPlayer("pause", data.amount);
			    } else {
			    	$('#jquery_jplayer_1').jPlayer("play", data.amount);
			    }
			});
			simplify.setNewPlaybackState(Simplify.PLAYBACK_STATE_PAUSED);
		});
	}
})();