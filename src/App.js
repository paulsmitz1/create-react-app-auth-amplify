//Imports
import React, { Component } from 'react';
import './App.css';
import { withAuthenticator } from 'aws-amplify-react'
import Amplify, { API } from 'aws-amplify';
import awsConfig from './aws-exports';
import awsVideoConfig from "./aws-video-exports";
import Auth from "@aws-amplify/auth";
import Select from 'react-select'

let theStreams = [ "https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8", "http://demo.unified-streaming.com/video/tears-of-steel/tears-of-steel.ism/.m3u8", "https://multiplatform-f.akamaihd.net/i/multi/will/bunny/big_buck_bunny_,640x360_400,640x360_700,640x360_1000,950x540_1500,.f4v.csmil/master.m3u8", awsVideoConfig.awsOutputLiveHLS ];
let options = [];
let selectedStream = theStreams[0];

//Configure
Amplify.configure(awsConfig);

//Components

class App extends Component {

    render() {
        console.log("rendering, selectedStream: " + selectedStream);

      return (
      <div className="App">
          <video
              id="myplayer"
              className="video"
              preload="auto"
              autoPlay={"autoplay"}
              controls={"controls"}>
              <source id="source" src={ selectedStream }
                  type='application/x-mpegURL' />
              <p className="vjs-no-js">
                  To view this video please enable JavaScript, and consider upgrading to a
                  web browser that
                  <a href="https://videojs.com/html5-video-support/" target="_blank">
                      supports HTML5 video
                  </a>
              </p>
          </video>
          <Select options = {options} onChange={this.change.bind(this)} />
      </div>

    );

  }

    change(event) {
        // event.persist(); //THE MAIN LINE THAT WILL SET THE VALUE
        console.log("changed to " + event.value);
        selectedStream = event.value
        let video = document.getElementById('myplayer');
        let source = document.getElementById('source');
        video.pause();
        source.setAttribute('src',  selectedStream);
        video.load();
        video.play();
    }

    async componentDidMount() {
        this.setState({streams: theStreams});
        let streams = await this.getStreams();
        console.log(JSON.stringify(streams));
        this.createOptions();
    }

  createOptions(){
      options = [];
      for (let i = 0; i < theStreams.length; i++) {
          let option = {
              value: theStreams[i],
              label: theStreams[i]
          }
          options.push(option)
      }
  }

    async getStreams() {
        const apiName = 'Streams';
        const path = '/Streams';
        const myInit = {
            headers: {
                //Authorization: `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`,
            },
        };

        return API.get(apiName, path, myInit);
    }
}

export default withAuthenticator(App, true);
