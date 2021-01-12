/* Amplify Params - DO NOT EDIT
	ENV
	REGION
Amplify Params - DO NOT EDIT */

//
// This lambda should:
// Inputs:
// None
//
// Implementation:
// Call mediaPackage.listOriginEndpoints, parse the data down to the required information which is:
//
//  Outputs:
// [
//  {
//   StreamName : text
//   StreamSources :
//   [
//      {
//       StreamURL: text
//      }
//   ]
//  }
// ]
//




exports.handler = async (event) => {
    if (event.method === "OPTIONS")
    {
        return http200({});
    }

    let AWS = require("aws-sdk");
    AWS.config.update({region:'us-east-1'});
    let params =
        {
            MaxResults: 50,
        };

    let mediaPackage = new AWS.MediaPackage();
    let error = null;
    let responseData = null;
    let request = mediaPackage.listOriginEndpoints(params, function(err, data)
    {
        error = err;
        responseData = data;
    });
    await request.promise();

    console.log("error = " + error + " data = " + responseData);

    if (!error && responseData)
    {
        let result = parseResponse(responseData);
        const response = http200(result);
        console.log(result);           // successful response
        return response;

    }
    else if (error)
    {
        return http400();
    }
    else
    {
        return http500();
    }
};


function parseResponse(responseData) {
    let response = [];
    responseData.OriginEndpoints.forEach((currentObject) =>
    {
        let currentStream = response.filter((e) => {
            return e.StreamName === currentObject.ChannelId
        });
        if (currentStream.length === 0) {
            currentStream = {
                "StreamName": currentObject.ChannelId,
                "StreamSources": [],
            };
            response.push(currentStream);
        }else{
            currentStream = currentStream[0];
        }

        let streamSource = {
            "StreamURL": currentObject.CmafPackage ? currentObject.CmafPackage.HlsManifests[0].Url : currentObject.Url,
        };
        currentStream.StreamSources.push(streamSource);

    });
    return response;
}



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
