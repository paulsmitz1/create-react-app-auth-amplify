//Imports
import React, { Component, useState } from 'react';
import './App.css';
import { withAuthenticator } from '@aws-amplify/ui-react';
import Amplify, { API } from 'aws-amplify';
import awsConfig from './aws-exports';
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

//LifeCycle
    render() {
        console.log("rendering, selectedStream: " + selectedStream);

        return (
            <div className="App">

                <video
                    id="myPlayer"
                    className="video"
                    preload="auto"
                    autoPlay={"autoplay"}
                    controls={"controls"}>
                    <source id="source" src={selectedStream}
                            type='application/x-mpegURL'/></video>

                <Select id="options" onChange={this.changeStream.bind(this)} options={options}/>


                <Modal footer={null} align="middle" title="Title" visible={this.state.modalVisible} onOk={this.handleModalOk} onCancel={this.handleModalCancel} primary >
                    <input id='streamName' type='text'/>
                    <button id='submit' title='Create Stream' onClick={this.createStream} />
                    <div id='result'></div>
                </Modal>

            </div>

        );

    }

    componentDidMount() {
        this.getStreams();
        console.log(JSON.stringify(theStreams));
        this.createOptions();
    }


//Modal
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
    showModal() {
        this.setState({
            modalVisible: true,
        });
        console.log("show Create Modal");
    }


//DropDown
    changeStream(event) {
        if (event.value === "create") {
            this.showModal();
            return;
        }
        console.log("changed to " + event.value);
        selectedStream = event.value
        let video = document.getElementById('myPlayer');
        video.pause();
        video.innerHTML = "";
        event.value.StreamSources.forEach(source => {
            video.innerHTML = video.innerHTML + "<source src=" + source.StreamURL + " />";
        });
        video.load();
        video.play();
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


//API Calls
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
     createStream() {
        const apiName = 'CreateStream';
        const path = '/CreateStream';
        const myInit = {
            headers: {
                Authorization: 'Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}',
            },
            body: { "name" : document.getElementById('streamName').value }
        };

        API.post(apiName, path, myInit).then(result => {
            console.log(result);
            let resultDiv = document.getElementById("result");
            let newContent = "<p>Successfully created Stream " + result.StreamName + "</p>";
            newContent = newContent + "<p> you can use the following settings in OBS to start streaming </p>";

            //    {StreamName: "testing1234", Ingest: [{Name: "testing1234268568b4-3b04-cb42-533e-2d4ff4bf355d-input-P", Server: "rtmp://3.231.128.60:1935/testing1234268568b4-3b04-cb42-533e-2d4ff4bf355d-input-P", Key: "testing1234268568b4-3b04-cb42-533e-2d4ff4bf355d-input-P"}, {Name: "testing1234268568b4-3b04-cb42-533e-2d4ff4bf355d-input-B", Server: "rtmp://54.208.187.88:1935/testing1234268568b4-3b04-cb42-533e-2d4ff4bf355d-input-B", Key: "testing1234268568b4-3b04-cb42-533e-2d4ff4bf355d-input-B"}]}
            for (let i = 0; i < result.Ingest.length; i++) {
                newContent = newContent + "<p>Endpoint Name:" + result.Ingest[i].Name + "</p>";
                newContent = newContent + "<p>Server:" + result.Ingest[i].Server + "</p>";
                newContent = newContent + "<p>Key:" + result.Ingest[i].Key + "</p>";
            }

            resultDiv.innerHTML = newContent;
        });
    }

}
export default withAuthenticator(App, true);
