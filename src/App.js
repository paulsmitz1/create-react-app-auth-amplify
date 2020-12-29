import React, { Component } from 'react';
import './App.css';
import { withAuthenticator } from 'aws-amplify-react'
import Amplify, { API } from 'aws-amplify';
import awsconfig from './aws-exports';
import awsvideoconfig from "./aws-video-exports";
import Auth from "@aws-amplify/auth";

Amplify.configure(awsconfig);

let theStreams = [ "https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8", awsvideoconfig.awsOutputLiveLL ];

class App extends Component {

    render() {

      return (
      <div className="App">
          <video
              id="myplayer"
              className="video"
              preload="auto"
              data-setup='{}'
              autoPlay={true}
              controls>
              <source src={ theStreams[0] }
                  type="application/x-mpegURL" />
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
  componentDidMount() {
      this.setState({ streams : theStreams});
      this.getStreams();
  }

    async getStreams() {
        const apiName = 'Streams';
        const path = '/Streams';
        const myInit = {
            headers: {
                //Authorization: `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`,
            },
        };

        return await API.get(apiName, path, myInit);
    }
}

export default withAuthenticator(App, true);
