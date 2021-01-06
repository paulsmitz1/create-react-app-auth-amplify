


exports.handler = async (event) => {
    if (event.method === "OPTIONS")
    {
        return http200({});
    }
    let channelName = event.name;
    let mediaPackageParams = await createMediaPackageChannel(channelName);
    console.log("mediaPackageParams = " + JSON.stringify(mediaPackageParams));
    console.log("media package created");
    await createEndpoints(mediaPackageParams.PackageID, mediaPackageParams.MediaPackage);
    console.log("media package endpoints created");
    let mediaPackageIngestEndpoints = mediaPackageParams.Response.HlsIngest.IngestEndpoints;

    await createMediaLiveChannel(channelName,mediaPackageIngestEndpoints);
    console.log("media live endpoints created");

    return http200({});
};


async function createMediaLiveChannel(channelName,mediaPackageIngestEndpoints) {
    let AWS = require("aws-sdk");
    AWS.config.update({region: "us-east-1"});

    let guid = require("guid");

    let mediaLive = new AWS.MediaLive();
    console.log("Create Channel Request creating");
    console.log("mediaPackage ingest URLs = ", JSON.stringify(mediaPackageIngestEndpoints));

    let createMediaLiveChannelRequest =
        {
            "ChannelClass": "STANDARD",
            "Destinations": [
                {
                    "Id": channelName + guid.create(),
                    "Settings": [
                        {
                            "PasswordParam": mediaPackageIngestEndpoints[0].Password,
                            "Url": mediaPackageIngestEndpoints[0].Url,
                            "Username": mediaPackageIngestEndpoints[0].Username
                        },
                        {
                            "PasswordParam": mediaPackageIngestEndpoints[1].Password,
                            "Url": mediaPackageIngestEndpoints[1].Url,
                            "Username": mediaPackageIngestEndpoints[1].Username
                        }
                    ]
                },

            ],
            "EncoderSettings": {
                "AudioDescriptions": [
                    {
                        "AudioSelectorName": "audio-selector-1",
                        "Name": "audio_128k",
                        "AudioTypeControl": "FOLLOW_INPUT",
                        "CodecSettings": {
                            "AacSettings": {
                                "Bitrate": 128000,
                                "CodingMode": "CODING_MODE_2_0",
                                "InputType": "NORMAL",
                                "Profile": "LC",
                                "RateControlMode": "CBR",
                                "RawFormat": "NONE",
                                "SampleRate": 48000,
                                "Spec": "MPEG4"

                            }
                        },
                        "LanguageCodeControl": "FOLLOW_INPUT"

                    },

                ],
                "OutputGroups": [
                    {
                        "OutputGroupSettings": {
                            "HlsGroupSettings": {
                                "Destination": {
                                    "DestinationRefId": "destination-" + channelName
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
                                                "AudioOnlyHlsSettings": {
                                                    "AudioTrackType": "ALTERNATE_AUDIO_NOT_AUTO_SELECT"

                                                },
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
                "CaptionDescriptions": [
                    {
                        "CaptionSelectorName": "caption-selector-1",
                        "Name": "caption_webvtt",
                        "DestinationSettings": {
                            "WebvttDestinationSettings": {}
                        },

                    },

                ],

            },
            "InputAttachments": [
                {
                    "InputId": "3686936",
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

    console.log("Create Channel Request = " + JSON.stringify(createMediaLiveChannelRequest));

    let response;

    let promise = mediaLive.createChannel(createMediaLiveChannelRequest).promise();
    promise.then(
        function (data) {
            console.log("Create Channel Response = " + JSON.stringify(data));
            response = data;
        },
        function (error)
        {
            console.log("create Channel Response = " + JSON.stringify(error));

        });
    await promise;

}
//MediaPackage Channel
async function createMediaPackageChannel(channelName) {
    let AWS = require("aws-sdk");
    AWS.config.update({region:"us-east-1"});
    let guid = require("guid");

    let mediaPackage = new AWS.MediaPackage();
    let packageID = channelName + guid.create();
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
async function createEndpoints(packageID, mediaPackage) {
    console.log("About to create DASH");
    await createDashEndpoint(packageID, mediaPackage);
    console.log("About to create HLS");
    await createHLSEndpoint(packageID,mediaPackage);
    console.log("About to create CMAF");
    await createCMAFEndpoint(packageID,mediaPackage);
    console.log("About to create MSS");
    await createMSSEndpoint(packageID,mediaPackage);

}

async function originEndpointRequest(mediaPackage, createOriginEndpointRequest) {
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

async function createDashEndpoint(packageID, mediaPackage) {
    let createDashOriginEndpointRequest = {
        "Id": packageID + "-dash",
        "ChannelId": packageID,
        "Description": packageID + "-dash",
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
async function createHLSEndpoint(packageID, mediaPackage) {
    let createHLSOriginEndpointRequest = {
        "Id": packageID + "-hls",
        "ChannelId": packageID,
        "Description": packageID + "-hls",
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
async function createMSSEndpoint(packageID, mediaPackage) {
    let createMSSOriginEndpointRequest = {
        "Id": packageID + "-mss",
        "ChannelId": packageID,
        "Description": packageID + "-mss",
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
async function createCMAFEndpoint(packageID, mediaPackage) {
    let createCMAFOriginEndpointRequest = {
        "Id": packageID + "-cmaf",
        "ChannelId": packageID,
        "Description": packageID + "-cmaf",
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