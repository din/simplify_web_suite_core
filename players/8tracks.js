// 8tracks
// @hostname = 8tracks.com

if (window.top == window) {
    window.addEventListener("load", function() {
        var simplify = new Simplify();
        simplify.setCurrentPlayer("8tracks");

        interval = setInterval(function() {
            var mixPlayer = App.Trax.mixPlayer;
            if (mixPlayer) {
                clearInterval(interval);
                mixPlayer.on('play', function() {
                    simplify.setPlaybackPlaying();
                });
                mixPlayer.on('resume', function() {
                    simplify.setPlaybackPlaying();
                });
                mixPlayer.on('pause', function() {
                    updateSimplifyMetadata(simplify);
                    simplify.setPlaybackPaused();
                });
                mixPlayer.on('doneLoading', function() {
                    updateSimplifyMetadata(simplify);
                });
                mixPlayer.trackPlayer.on('seconds:1', function() {
                    updateSimplifyMetadata(simplify);
                });
            }
        }, 500);

        window.lastTrackId = null;
        window.trackChanged = true;
        updateSimplifyMetadata = function(simplify) {
            var song = App.Trax.mixPlayer;
            if (song.trackPlayer.soundManagerPlayer.smSound.loaded == false)
            {
              setTimeout(function()
              {
                updateSimplifyMetadata(simplify);
              }, 500);
              return;
            }

            if (window.lastTrackId != song.track.attributes["id"]) {
                simplify.setCurrentTrack({
                    "author": song.track.attributes["performer"],
                    "title": song.track.attributes["name"],
                    "album": song.track.attributes["release_name"],
                    "length": parseInt(song.trackPlayer.soundManagerPlayer.smSound.durationEstimate / 1000),
                    "features": {"disable_track_seeking" : true, "disable_previous_track" : true}
                });

                simplify.setCurrentArtwork(App.Trax.mix.get('cover_urls').sq500);

                window.lastTrackId = song.track.attributes["id"];
            }

            return song;
        };

        // var oldPause = App.Trax.mixPlayer.pause;
        // App.Trax.mixPlayer.pause = function() {
        //     var result = oldPause.apply(this);
        //     updateSimplifyMetadata(simplify);
        //     simplify.setPlaybackPaused();
        //     return result;
        // };

        // var oldPlay = App.Trax.mixPlayer.play;
        // App.Trax.mixPlayer.play = function() {
        //     var result = oldPlay.apply(this);
        //     updateSimplifyMetadata(simplify);
        //     simplify.setPlaybackPlaying();
        //     return result;
        // };


        simplify.bindToVolumeRequest(function() {
            if (typeof App.Trax.mixPlayer == "undefined") return 0;
            return App.Trax.mixPlayer.trackPlayer.globalVolume;

        }).bindToTrackPositionRequest(function() {
            if (typeof App.Trax.mixPlayer == "undefined") return 0;
            if (window.trackChanged == false) {
                return 0;
            }
            return parseInt(App.Trax.mixPlayer.trackPlayer.currentPositionInMs / 1000);
        }).bind(Simplify.MESSAGE_DID_SELECT_PREVIOUS_TRACK, function() {
            // Nothing to operate
        }).bind(Simplify.MESSAGE_DID_SELECT_NEXT_TRACK, function() {
            if (typeof App.Trax.mixPlayer == "undefined") return;
            App.Trax.mixPlayer.next();
            simplify.setPlaybackPlaying();
            window.trackChanged = false;
            setTimeout(function() {
                window.trackChanged = true;
            }, 300);
        }).bind(Simplify.MESSAGE_DID_CHANGE_PLAYBACK_STATE, function(data) {

            if (typeof App.Trax.mixPlayer == "undefined") return;
            if (data["state"] == Simplify.PLAYBACK_STATE_PLAYING) {
                App.Trax.mixPlayer.play();
                return
            };
            if (data["state"] == Simplify.PLAYBACK_STATE_PAUSED) {
                App.Trax.mixPlayer.pause();
                return
            };
        }).bind(Simplify.MESSAGE_DID_CHANGE_VOLUME, function(data) {
            if (data["amount"] == null || typeof App.Trax.mixPlayer == "undefined") return;
            App.Trax.mixPlayer.setVolume(data.amount);
        }).bind(Simplify.MESSAGE_DID_CHANGE_TRACK_POSITION, function(data) {
            if (data["amount"] == null || typeof App.Trax.mixPlayer == "undefined") return;
            App.Trax.mixPlayer.trackPlayer.seekTo(parseFloat(data["amount"]) * 1000);
        });

        window.addEventListener("unload", function() {
            simplify.closeCurrentPlayer();
        });
    })
}
