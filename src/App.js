import React, { Component } from 'react';
import './App.css';
import { withAuthenticator } from 'aws-amplify-react'
import Amplify, { Auth } from 'aws-amplify';
import aws_exports from './aws-exports';
import PlayerView from "react-native-aws-ivs-player-view";

Amplify.configure(aws_exports);

class App extends Component {
  render() {
    return (
      <div className="App">
        <PlayerView
            style={styles.player}
            ref={(e: any) => {
              this.player = e;
            }}
        />
        <Button
            onPress={() => {
              this.player.pause();
            }}
            title="Pause"
        />
        <Button
            onPress={() => {
              this.player.load(
                  'https://fcc3ddae59ed.us-west-2.playback.live-video.net/api/video/v1/us-west-2.893648527354.channel.DmumNckWFTqz.m3u8'
              );
            }}
            title="Play Me"
        />
      </div>
    );
  }
}

export default withAuthenticator(App, true);
