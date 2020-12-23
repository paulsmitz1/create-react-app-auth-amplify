// This shows how to include the Amazon IVS Player with a script tag from our CDN
// If self hosting, you may not be able to use the create() method since it requires
// that file names do not change and are all hosted from the same directory.

(function (IVSPlayerPackage) {
    // First, check if the browser supports the IVS player.
    if (!IVSPlayerPackage.isPlayerSupported) {
        console.warn("The current browser does not support the IVS player.");
        return;
    }

    const PlayerState = IVSPlayerPackage.PlayerState;
    const PlayerEventType = IVSPlayerPackage.PlayerEventType;

    // Initialize player
    const player = IVSPlayerPackage.create();
    console.log("IVS Player version:", player.getVersion());
    player.attachHTMLVideoElement(document.getElementById("video-player"));

    // Attach event listeners
    player.addEventListener(PlayerState.PLAYING, function () {
        console.log("Player State - PLAYING");
    });
    player.addEventListener(PlayerState.ENDED, function () {
        console.log("Player State - ENDED");
    });
    player.addEventListener(PlayerState.READY, function () {
        console.log("Player State - READY");
    });
    player.addEventListener(PlayerEventType.ERROR, function (err) {
        console.warn("Player Event - ERROR:", err);
    });
    player.addEventListener(PlayerEventType.TEXT_METADATA_CUE, (cue) => {
        const metadataText = cue.text;
        const position = player.getPosition().toFixed(2);
        console.log(
            `PlayerEvent - TEXT_METADATA_CUE: "${metadataText}". Observed ${position}s after playback started.`
        );
    });

    // Setup stream and play
    player.setAutoplay(true);
    player.load(
        "https://fcc3ddae59ed.us-west-2.playback.live-video.net/api/video/v1/us-west-2.893648527354.channel.DmumNckWFTqz.m3u8"
    );
    player.setVolume(0.5);
})(window.IVSPlayer);