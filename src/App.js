import React, { Component } from 'react';
import './App.css';
import { withAuthenticator } from 'aws-amplify-react'
import 'video.js'
import Amplify from "@aws-amplify/core";
import aws_exports from './aws-exports';

Amplify.configure(aws_exports);

class App extends Component {
  render() {
    return (
      <div className="App">
          <video
              id="my-player"
              className="video-js"
              controls
              preload="auto"
              poster="//vjs.zencdn.net/v/oceans.png"
              data-setup='{}'>
              <source src="'https://fcc3ddae59ed.us-west-2.playback.live-video.net/api/video/v1/us-west-2.893648527354.channel.DmumNckWFTqz.m3u8'"></source>
              <p className="vjs-no-js">
                  To view this video please enable JavaScript, and consider upgrading to a
                  web browser that
                  <a href="https://videojs.com/html5-video-support/" target="_blank">
                      supports HTML5 video
                  </a>
              </p>
          </video>


      </div>
    );
  }
}

export default withAuthenticator(App, true);
