//
// This lambda should:
// Inputs:
// {
//   "name": "<New Stream Name>"
// }
//
// What it will do:
// Create a MediaPackage Channel
// Create 4 egress endpoints associated with the MediaPackage Channel
// Create a MediaLive Input Endpoint which requires:
//      Security Group for ingress (We already have one created during the Amplify add video)
//      Passwords In ParameterStore
// Create a MediaLive Egress Channel
// Connect the Media Live Egress Channel to the MediaPackage Channel
//
// Implementation:
// Call mediaPackage.createChannel, parse the data down to the required information which is:
// mediaPackage.PackageID
// mediaPackage.HlsIngest.IngestEndpoints
//
// Call mediaPackage.createOriginEndpoint 4 times to create an egress endpoint for DASH, HLS, MSS, CMAF.
//
// Call ParameterStore.putParameter to store the passwords for each of the mediaPackage ingest endpoints
//
// Call mediaLive.listInputSecurityGroups to get the security group associated with the MediaLive Endpoint
//
// Call mediaLive.createInput parsing the responses of mediaLive.listInputSecurityGroups
//
// Call mediaLive.createChannel parsing the responses of mediaPackage.createChannel, mediaLive.createInput.
//
//  Outputs:
//  {
//   StreamName : text
//   Ingest :
//   [
//      {
//       Name: text
//       Server: text
//       Key: text
//      }
//   ]
//  }
//

exports.handler = async (event) => {
    if (event.method === "OPTIONS")
    {
        return http200({});
    }

    let channelName = event.name;

    let GUID = require("guid");
    let guid = GUID.create();

    let mediaPackageParams = await createMediaPackageChannel(channelName,guid);

    await createEndpoints(mediaPackageParams.PackageID, guid, mediaPackageParams.MediaPackage);

    let mediaPackageIngestEndpoints = mediaPackageParams.Response.HlsIngest.IngestEndpoints;
    for (let i = 0; i < mediaPackageIngestEndpoints.length; i++) {
        await storeStreamPasswordsInParameterStore(channelName, guid, i,mediaPackageIngestEndpoints);
    }

    let listSecurityGroupResponse = await listInputSecurityGroup();
    let createMediaLiveInputResponse =  await createMediaLiveInput(channelName, guid, listSecurityGroupResponse);

    await createMediaLiveChannel(channelName, guid, mediaPackageIngestEndpoints, createMediaLiveInputResponse);

    let ingestArray = [];
    for (let i = 0; i < createMediaLiveInputResponse.Input.Destinations.length; i++) {
        let ingest = {
            "Name": createMediaLiveInputResponse.Input.Destinations[i].Url.substring(createMediaLiveInputResponse.Input.Destinations[i].Url.lastIndexOf('/') + 1),
            "Server": createMediaLiveInputResponse.Input.Destinations[i].Url,
            "Key": createMediaLiveInputResponse.Input.Destinations[i].Url.substring(createMediaLiveInputResponse.Input.Destinations[i].Url.lastIndexOf('/') + 1),
        }
        ingestArray.push(ingest);
    }
    return http200( {
                    "StreamName" : channelName,
                    "Ingest" : ingestArray,
                    });
};

//Parameter Store
async function storeStreamPasswordsInParameterStore(channelName, guid, keyNumber, mediaPackageIngestEndpoints)
{
    let AWS = require("aws-sdk");
    AWS.config.update({region: "us-east-1"});
    let ParameterStore = new AWS.SSM();
    let parameter = {
        "DataType": "text",
        "Description": channelName + guid + "-mediaPackage-Ingest-Key-" + keyNumber,
        "Name": channelName + guid + "-mediaPackage-Ingest-Key-" + keyNumber,
        "Tags": [{
            "Key":"ChannelName",
            "Value":channelName
        }],
        "Tier": "Standard",
        "Type": "SecureString",
        "Value": mediaPackageIngestEndpoints[keyNumber].Password
    }
    let promise = ParameterStore.putParameter(parameter).promise();
    promise.then(
        function (data) {
            console.log("Create Parameter Response = " + JSON.stringify(data));
        },
        function (error)
        {

        });
    await promise;
}
//Security Groups
async function listInputSecurityGroup()
{
    let AWS = require("aws-sdk");
    AWS.config.update({region: "us-east-1"});
    let mediaLive = new AWS.MediaLive();
    let response = null;
    let promise = mediaLive.listInputSecurityGroups().promise();//.listInputSecurityGroup(securityGroupRequest).promise();
    promise.then(
        function (data) {
            response = data;
        },
        function (error) {

        });
    await promise;
    return response;
}

//MediaLive
async function createMediaLiveInput(channelName, guid, listSecurityGroupsResponse)
{
    let AWS = require("aws-sdk");
    AWS.config.update({region: "us-east-1"});


    let mediaLive = new AWS.MediaLive();
    let createMediaLiveInputRequest = {
        "Name": channelName + guid + "-input",
        "RoleArn": "arn:aws:iam::569327773807:role/service-role/defaultStream-developtwo-medialive-access-role-us-east-1",
        "InputSecurityGroups": [ listSecurityGroupsResponse.InputSecurityGroups[0].Id ],
        "Tags": {
            "ChannelName": channelName
        },
        "Destinations": [
            {
                StreamName: channelName + guid + "-input-P"
            },
            {
                StreamName: channelName + guid + "-input-B"
            },
        ],
        "Type": "RTMP_PUSH",
    };
    console.log("createInputRequest = ", createMediaLiveInputRequest);
    let response = null;
    let promise = mediaLive.createInput(createMediaLiveInputRequest).promise();
    promise.then(
        function (data) {
            response = data;
            console.log("Create MediaLiveInput Response = " + JSON.stringify(data));
        },
        function (error)
        {

        });
    await promise;
    return response;
}
async function createMediaLiveChannel(channelName, guid,mediaPackageIngestEndpoints, createMediaLiveInputResponse)
{
    let AWS = require("aws-sdk");
    AWS.config.update({region: "us-east-1"});


    let mediaLive = new AWS.MediaLive();
    console.log("Create Channel Request creating");
    console.log("mediaPackage ingest URLs = ", JSON.stringify(mediaPackageIngestEndpoints));

    let createMediaLiveChannelRequest =
        {
            "ChannelClass": "STANDARD",
            "Destinations": [
                {
                    "Id": channelName + guid,
                    "Settings": [
                        {
                            "PasswordParam": channelName + guid + "-mediaPackage-Ingest-Key-0",
                            "Url": mediaPackageIngestEndpoints[0].Url,
                            "Username": mediaPackageIngestEndpoints[0].Username
                        },
                        {
                            "PasswordParam": channelName + guid + "-mediaPackage-Ingest-Key-0",
                            "Url": mediaPackageIngestEndpoints[1].Url,
                            "Username": mediaPackageIngestEndpoints[1].Username
                        }
                    ]
                },

            ],
            "EncoderSettings": {
                "AudioDescriptions": [],
                "OutputGroups": [
                    {
                        "OutputGroupSettings": {
                            "HlsGroupSettings": {
                                "Destination": {
                                    "DestinationRefId": channelName + guid,
                                },
                                "AdMarkers": [
                                    "ELEMENTAL_SCTE35"
                                ],
                                "CaptionLanguageMappings": [],
                                "CaptionLanguageSetting": "OMIT",
                                "ClientCache": "ENABLED",
                                "CodecSpecification": "RFC_4281",
                                "DirectoryStructure": "SINGLE_DIRECTORY",
                                "HlsCdnSettings": {
                                    "HlsWebdavSettings": {
                                        "ConnectionRetryInterval": 1,
                                        "FilecacheDuration": 300,
                                        "HttpTransferMode": "NON_CHUNKED",
                                        "NumRetries": 10,
                                        "RestartDelay": 15
                                    }
                                },
                                "IndexNSegments": 3,
                                "InputLossAction": "PAUSE_OUTPUT",
                                "IvInManifest": "INCLUDE",
                                "IvSource": "FOLLOWS_SEGMENT_NUMBER",
                                "KeepSegments": 11,
                                "ManifestCompression": "NONE",
                                "ManifestDurationFormat": "FLOATING_POINT",
                                "Mode": "LIVE",
                                "OutputSelection": "MANIFESTS_AND_SEGMENTS",
                                "ProgramDateTime": "EXCLUDE",
                                "ProgramDateTimePeriod": 30,
                                "SegmentLength": 2,
                                "SegmentationMode": "USE_SEGMENT_DURATION",
                                "StreamInfResolution": "INCLUDE",
                                "TimedMetadataId3Frame": "NONE",
                                "TimedMetadataId3Period": 10,
                                "TsFileMode": "SEGMENTED_FILES"
                            }
                        },
                            "Outputs": [
                                {
                                    "OutputSettings": {
                                        "HlsOutputSettings": {
                                            "HlsSettings": {
                                                "StandardHlsSettings": {
                                                    "M3u8Settings": {
                                                        "AudioFramesPerPes": 4,
                                                        "AudioPids": "492-498",
                                                        "EcmPid": "8182",
                                                        "PcrControl": "PCR_EVERY_PES_PACKET",
                                                        "PmtPid": "480",
                                                        "ProgramNum": 1,
                                                        "Scte35Behavior": "PASSTHROUGH",
                                                        "Scte35Pid": "500",
                                                        "TimedMetadataBehavior": "NO_PASSTHROUGH",
                                                        "TimedMetadataPid": "502",
                                                        "VideoPid": "481"
                                                    },
                                                    "AudioRenditionSets": "PROGRAM_AUDIO"
                                                }
                                            },
                                            "NameModifier": "_720"

                                        },

                                    },
                                    "AudioDescriptionNames": [],
                                    "CaptionDescriptionNames": [],
                                    "VideoDescriptionName": "video_720"
                                },

                            ],
                    },
                ],
                "TimecodeConfig": {
                    "Source": "EMBEDDED"
                },
                "VideoDescriptions": [
                    {
                        "Name": "video_720",
                        "CodecSettings": {
                            "H264Settings": {
                                "AdaptiveQuantization": "MEDIUM",
                                "AfdSignaling": "NONE",
                                "Bitrate": 1500000,
                                "ColorMetadata": "INSERT",
                                "EntropyEncoding": "CABAC",
                                "FlickerAq": "ENABLED",
                                "FramerateControl": "SPECIFIED",
                                "FramerateDenominator": 1001,
                                "FramerateNumerator": 30000,
                                "GopBReference": "DISABLED",
                                "GopClosedCadence": 1,
                                "GopNumBFrames": 2,
                                "GopSize": 30,
                                "GopSizeUnits": "FRAMES",
                                "Level": "H264_LEVEL_AUTO",
                                "LookAheadRateControl": "LOW",
                                "MaxBitrate": 2000000,
                                "NumRefFrames": 1,
                                "ParControl": "INITIALIZE_FROM_SOURCE",
                                "Profile": "HIGH",
                                "RateControlMode": "VBR",
                                "ScanType": "PROGRESSIVE",
                                "SceneChangeDetect": "ENABLED",
                                "Slices": 1,
                                "SpatialAq": "ENABLED",
                                "Syntax": "DEFAULT",
                                "TemporalAq": "ENABLED",
                                "TimecodeInsertion": "DISABLED"

                            },

                        },
                        "Height": 720,
                        "RespondToAfd": "PASSTHROUGH",
                        "ScalingBehavior": "DEFAULT",
                        "Sharpness": 50,
                        "Width": "1280"
                    },

                ],
                "AvailConfiguration": {
                    "AvailSettings": {
                        "Scte35SpliceInsert": {
                            "NoRegionalBlackoutFlag": "FOLLOW",
                            "WebDeliveryAllowedFlag": "FOLLOW"

                        },

                    }
                },
                "CaptionDescriptions": [],
            },
            "InputAttachments": [
                {
                    "InputId": createMediaLiveInputResponse.Input.Id,
                    "InputSettings": {
                        "AudioSelectors": [
                            {
                                "Name": "audio-selector-1",
                                
                            },

                        ],
                        "CaptionSelectors": [
                            {
                                "Name": "caption-selector-1",
                                "SelectorSettings": {
                                    "EmbeddedSourceSettings": {
                                        "Convert608To708": "UPCONVERT",
                                        "Scte20Detection": "AUTO",
                                        "Source608ChannelNumber": 1,
                                        "Source608TrackNumber": 1
                                    },

                                }
                            },

                        ],
                        "DeblockFilter": "DISABLED",
                        "DenoiseFilter": "DISABLED",
                        "InputFilter": "AUTO",
                        "NetworkInputSettings": {
                            "ServerValidation": "CHECK_CRYPTOGRAPHY_AND_VALIDATE_NAME",

                        },
                        "SourceEndBehavior": "CONTINUE",
                        "VideoSelector": {
                            "ColorSpace": "FOLLOW",
                            "ColorSpaceUsage": "FALLBACK",

                        }
                    }
                },

            ],
            "LogLevel": "DISABLED",
            "Name": channelName,
            "RoleArn": "arn:aws:iam::569327773807:role/service-role/defaultStream-developtwo-medialive-access-role-us-east-1",
            "Tags": {
                "ChannelName": channelName
            }
        };


    let response;

    let promise = mediaLive.createChannel(createMediaLiveChannelRequest).promise();
    promise.then(
        function (data) {
            response = data;
        },
        function (error) {
        });
    await promise;

}


//MediaPackage Channel
async function createMediaPackageChannel(channelName, guid)
{
    let AWS = require("aws-sdk");
    AWS.config.update({region:"us-east-1"});

    let mediaPackage = new AWS.MediaPackage();
    let packageID = channelName + guid;
    let createMediaPackageChannelRequest =
        {
            "Description": channelName,
            "Id": packageID,
            "Tags": {
                "ChannelName" : channelName,
            }
        };

    let response = null
    let promise = mediaPackage.createChannel(createMediaPackageChannelRequest).promise();
        promise.then(
            function (data) {
                console.log("Create Channel Response = " + JSON.stringify(data));
                response = data;
            },
            function (error)
        {

    });
    await promise;
    return { "PackageID": packageID, "MediaPackage": mediaPackage, "Response":response};

}


//Endpoints
async function createEndpoints(packageID, guid, mediaPackage)
{
    console.log("About to create DASH");
    await createDashEndpoint(packageID, guid, mediaPackage);
    console.log("About to create HLS");
    await createHLSEndpoint(packageID, guid, mediaPackage);
    console.log("About to create CMAF");
    await createCMAFEndpoint(packageID, guid, mediaPackage);
    console.log("About to create MSS");
    await createMSSEndpoint(packageID, guid, mediaPackage);

}
async function createDashEndpoint(packageID, guid, mediaPackage)
{
    let createDashOriginEndpointRequest = {
        "Id": packageID + guid + "-dash",
        "ChannelId": packageID,
        "Description": packageID + guid + "-dash",
        "StartoverWindowSeconds": 86400,
        "TimeDelaySeconds": 0,
        "ManifestName": "index",
        "Whitelist": [],
        "DashPackage": {
            "SegmentDurationSeconds": 2,
            "ManifestWindowSeconds": 6,
            "Profile": "NONE",
            "MinUpdatePeriodSeconds": 2,
            "MinBufferTimeSeconds": 4,
            "SuggestedPresentationDelaySeconds": 2,
            "PeriodTriggers": [],
            "ManifestLayout": "FULL",
            "SegmentTemplateFormat": "NUMBER_WITH_TIMELINE",
            "AdTriggers": [
                "SPLICE_INSERT",
                "PROVIDER_ADVERTISEMENT",
                "DISTRIBUTOR_ADVERTISEMENT",
                "PROVIDER_PLACEMENT_OPPORTUNITY",
                "DISTRIBUTOR_PLACEMENT_OPPORTUNITY"
            ],
            "AdsOnDeliveryRestrictions": "RESTRICTED",
            "UtcTiming": "NONE",
            "StreamSelection": {
                "StreamOrder": "ORIGINAL"
            }
        },
        "Origination": "ALLOW"
    };
    await originEndpointRequest(mediaPackage, createDashOriginEndpointRequest);
}
async function createHLSEndpoint(packageID, guid, mediaPackage)
{
    let createHLSOriginEndpointRequest = {
        "Id": packageID + guid + "-hls",
        "ChannelId": packageID,
        "Description": packageID + guid + "-hls",
        "StartoverWindowSeconds": 86400,
        "TimeDelaySeconds": 0,
        "ManifestName": "index",
        "Whitelist": [],
        "HlsPackage": {
            "SegmentDurationSeconds": 2,
            "PlaylistWindowSeconds": 6,
            "PlaylistType": "EVENT",
            "AdMarkers": "SCTE35_ENHANCED",
            "AdTriggers": [
                "SPLICE_INSERT",
                "PROVIDER_ADVERTISEMENT",
                "DISTRIBUTOR_ADVERTISEMENT",
                "PROVIDER_PLACEMENT_OPPORTUNITY",
                "DISTRIBUTOR_PLACEMENT_OPPORTUNITY"
            ],
            "AdsOnDeliveryRestrictions": "RESTRICTED",
            "ProgramDateTimeIntervalSeconds": 0,
            "IncludeIframeOnlyStream": false,
            "UseAudioRenditionGroup": false,
            "StreamSelection": {
                "StreamOrder": "ORIGINAL"
            }
        },
        "Origination": "ALLOW"
    };

    await originEndpointRequest(mediaPackage, createHLSOriginEndpointRequest);

}
async function createMSSEndpoint(packageID, guid, mediaPackage)
{
    let createMSSOriginEndpointRequest = {
        "Id": packageID + guid + "-mss",
        "ChannelId": packageID,
        "Description": packageID + guid + "-mss",
        "StartoverWindowSeconds": 86400,
        "TimeDelaySeconds": 0,
        "ManifestName": "index",
        "Whitelist": [],
        "MssPackage": {
            "ManifestWindowSeconds": 6,
            "SegmentDurationSeconds": 2,
            "StreamSelection": {
                "StreamOrder": "ORIGINAL"
            }
        },
        "Origination": "ALLOW"
    };

    await originEndpointRequest(mediaPackage, createMSSOriginEndpointRequest);
}
async function createCMAFEndpoint(packageID, guid, mediaPackage)
{
    let createCMAFOriginEndpointRequest = {
        "Id": packageID + guid + "-cmaf",
        "ChannelId": packageID,
        "Description": packageID + guid + "-cmaf",
        "StartoverWindowSeconds": 86400,
        "TimeDelaySeconds": 0,
        "ManifestName": "index",
        "Whitelist": [],
        "CmafPackage": {
            "SegmentDurationSeconds": 2,
            "SegmentPrefix": "defaultStream-developtwo",
            "HlsManifests": [
                {
                    "Id": "cmaf",
                    "PlaylistWindowSeconds": 6,
                    "PlaylistType": "EVENT",
                    "AdMarkers": "SCTE35_ENHANCED",
                    "AdTriggers": [
                        "SPLICE_INSERT",
                        "PROVIDER_ADVERTISEMENT",
                        "DISTRIBUTOR_ADVERTISEMENT",
                        "PROVIDER_PLACEMENT_OPPORTUNITY",
                        "DISTRIBUTOR_PLACEMENT_OPPORTUNITY"
                    ],
                    "AdsOnDeliveryRestrictions": "RESTRICTED",
                    "IncludeIframeOnlyStream": false
                }
            ],
            "StreamSelection": {
                "StreamOrder": "ORIGINAL"
            }
        },
        "Origination": "ALLOW"
    };
    await originEndpointRequest(mediaPackage, createCMAFOriginEndpointRequest);
}

async function originEndpointRequest(mediaPackage, createOriginEndpointRequest)
{
    console.log("About to create origin request with: " + JSON.stringify(createOriginEndpointRequest));
    let promise = mediaPackage.createOriginEndpoint(createOriginEndpointRequest).promise();
    promise.then(
        function (data) {
            console.log("Create Endpoint Response = " + JSON.stringify(data));
        },
        function (error)
        {

        });
    await promise;
}

//Return Types

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