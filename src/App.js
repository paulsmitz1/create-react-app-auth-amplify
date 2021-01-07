//Imports
import React, { Component, useState } from 'react';
import './App.css';
import { withAuthenticator } from 'aws-amplify-react'
import Amplify, { API } from 'aws-amplify';
import awsConfig from './aws-exports';
import awsVideoConfig from "./aws-video-exports";
import Auth from "@aws-amplify/auth";
import Select from 'react-select'
import { Modal } from 'antd';

let theStreams =
    [
    {
        "StreamName": "bipbop",
        "StreamSources": [
            {
                "StreamURL": "https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8"
            }
        ]
    },
    {
        "StreamName": "tear-of-steel",
        "StreamSources": [
            {
                "StreamURL": "http://demo.unified-streaming.com/video/tears-of-steel/tears-of-steel.ism/.m3u8"
            }
        ]
    },
    {
        "StreamName": "bunny",
        "StreamSources": [
            {
                "StreamURL": "https://multiplatform-f.akamaihd.net/i/multi/will/bunny/big_buck_bunny_,640x360_400,640x360_700,640x360_1000,950x540_1500,.f4v.csmil/master.m3u8"
            }
        ]
    }
    ];
let options = [];
let selectedStream = theStreams[0];

//Configure
Amplify.configure(awsConfig);

//Components

class App extends Component {
constructor() {
    super();
    this.state = { modalVisible: false }
}
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
                    <source id="source" src={selectedStream}
                            type='application/x-mpegURL'/>
                    <p className="vjs-no-js">
                        To view this video please enable JavaScript, and consider upgrading to a
                        web browser that
                        <a href="https://videojs.com/html5-video-support/" target="_blank">
                            supports HTML5 video
                        </a>
                    </p>
                </video>
                <Select id="options" onChange={this.change.bind(this)} options={options}/>
                <Modal footer={null} align="middle" title="Title" visible={this.state.modalVisible} onOk={this.handleModalOk} onCancel={this.handleModalCancel} primary >
                    <input type='text'
                           ref={(input) => { this.testInput = input; }} ></input>
                </Modal>
            </div>

        );

    }

    handleModalOk(e) {
        console.log(e);
        this.setState({
            modalVisible: false,
        });
    }
    handleModalCancel(e) {
        console.log(e);
        this.setState({
            modalVisible: false,
        });
    }
    createNewStream() {
        this.setState({
            modalVisible: true,
        });
        console.log("create Stream");
    }
    change(event) {
        if (event.value === "create") {
            this.createNewStream();
            return;
        }
        console.log("changed to " + event.value);
        selectedStream = event.value
        let video = document.getElementById('myplayer');
        video.pause();
        video.innerHTML = "";
        event.value.StreamSources.forEach(source => {
            video.innerHTML = video.innerHTML + "<source src=" + source.StreamURL + " />";
        });
        video.load();
        video.play();
    }

    componentDidMount() {
        this.getStreams();
        console.log(JSON.stringify(theStreams));
        this.createOptions();
    }

    createOptions() {
        let newOptions = [];
        console.log(JSON.stringify(theStreams));

        for (let i = 0; i < theStreams.length; i++) {
            let option =
                {
                    value: theStreams[i],
                    label: theStreams[i].StreamName
                }
            newOptions.push(option);
        }
        let createOption =
            {
                value: "create",
                label: "Create New Stream"
            }
        newOptions.push(createOption);
        options = newOptions;
        this.setState(options);
    }

    getStreams() {
        const apiName = 'Streams';
        const path = '/Streams';
        const myInit = {
            headers: {
                Authorization: 'Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}',
            },
        };

        API.get(apiName, path, myInit).then(result => {
            console.log(JSON.stringify(result));
            theStreams = result;
            this.setState({theStreams: result});
            this.createOptions();
        });
    }


}
export default withAuthenticator(App, true);
