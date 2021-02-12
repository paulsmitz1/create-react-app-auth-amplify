/* Amplify Params - DO NOT EDIT
	ENV
	REGION
Amplify Params - DO NOT EDIT */

exports.handler = async (event) => {
    if (event.method === "OPTIONS")
    {
        return http200({});
    }

    let body = JSON.parse(event.body)
    let channelId = body.ChannelId;


    let AWS = require("aws-sdk");
    AWS.config.update({region: "us-east-1"});

    let mediaLive = new AWS.MediaLive();
    mediaLive.startChannel()

    let startMediaLiveChannelRequest = {
        "ChannelId": channelId,
    };

    let response = null;
    let promise = mediaLive.startChannel(startMediaLiveChannelRequest).promise();
    promise.then(
        function (data) {
            response = data;
            console.log("Start MediaLiveChannel Response = " + JSON.stringify(data));
        },
        function (error)
        {
            return http400();
        });
    await promise;
    return http200( {});
};


function http200(body) {
    return {
        statusCode: 200,
        headers: getHeaders(),
        body: JSON.stringify(body)
    };
}

function http400() {
    return {
        statusCode: 400,
        headers: getHeaders(),
        body: JSON.stringify(error)
    };
}
function http500() {
    return {
        statusCode: 500,
        headers: getHeaders(),
        body: "Shouldn't get this"
    };
}
function getHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
    };
}