import React, { Component } from 'react';
import './App.css';
import { withAuthenticator } from 'aws-amplify-react'
import Amplify, { Auth } from 'aws-amplify';
import aws_exports from './aws-exports';
Amplify.configure(aws_exports);

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <script src="https://player.live-video.net/1.2.0/amazon-ivs-player.min.js" />
          <video id="video-player" playsInline />
          <script src="./script.js" />
        </header>
      </div>
    );
  }
}

export default withAuthenticator(App, true);
