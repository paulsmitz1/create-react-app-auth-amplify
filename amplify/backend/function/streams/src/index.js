
exports.handler = async (event) => {
    let AWS = require("aws-sdk");
    let params = {
        MaxResults: 20,
    };
    let mediapackage = new AWS.MediaPackage();
    var error;
    var responseData;
    var request = mediapackage.listChannels(params, function(err, data) {
        error = err;
        responseData = data;
    });
    await request.promise();

    console.log("error = " + error + " data = " + responseData)
    if (!error && responseData)
    {

        const response = {
            statusCode: 200,
            //  Uncomment below to enable CORS requests
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            body: responseData
        }
        console.log(responseData);           // successful response
        return response;

    }
    else if (error)
    {
        const response = {
            statusCode: 400,
            //  Uncomment below to enable CORS requests
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            body: error
        }
        return response;
    }
    else {
        const response = {
            statusCode: 500,
            //  Uncomment below to enable CORS requests
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            body: "Shouldn't get this"
        }

        return response;
    }
};
