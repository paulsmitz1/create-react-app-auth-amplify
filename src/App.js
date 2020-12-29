import React, { Component } from 'react';
import './App.css';
import { withAuthenticator } from 'aws-amplify-react'
import Amplify from "@aws-amplify/core";
import aws_exports from './aws-exports';
import $ from 'jquery';
import awsvideoconfig from "./aws-video-exports";
import awsmobile from "./aws-exports";

Amplify.configure(aws_exports);

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

    getStreams(){
      $.getJSON(awsmobile.aws_cloud_logic_custom.find( Name => "Streams").endpoint + "/streams")
          .then(({ results }) => this.setState({ person: results }))
  }
}

export default withAuthenticator(App, true);
