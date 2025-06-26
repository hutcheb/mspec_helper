/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

[type AdsConstants
    [const uint 16 adsTcpDefaultPort 48898]
]

////////////////////////////////////////////////////////////////
// External types
////////////////////////////////////////////////////////////////

[enum PlcValueType external='true']

////////////////////////////////////////////////////////////////
// AMS/TCP Packet
////////////////////////////////////////////////////////////////

[type AmsTCPPacket byteOrder='LITTLE_ENDIAN'
    // AMS/TCP Header 6 bytes contains the tcpLength of the data packet.
    // These bytes must be set to 0.
    [reserved uint 16 '0x0000' ]
    // This array contains the length of the data packet.
    // It consists of the AMS-Header and the enclosed ADS data. The unit is bytes.
    [implicit uint 32 length 'userdata.lengthInBytes' ]
    // The AMS packet to be sent.
    [simple AmsPacket userdata ]
]

////////////////////////////////////////////////////////////////
// AMS/Serial Packet
////////////////////////////////////////////////////////////////

// If an AMS serial frame has been received and the frame is OK (magic cookie OK, CRC OK, correct fragment number etc.),
// then the receiver has to send an acknowledge frame, to inform the transmitter that the frame has arrived.
//
// @see [TwinCAT AMS via RS232 Specification](https://infosys.beckhoff.com/content/1033/tcadsamsserialspec/html/tcamssericalspec_amsframe.htm?id=8115637053270715044)
[type AmsSerialAcknowledgeFrame
    // Id for detecting an AMS serial frame.
    [simple uint 16 magicCookie ]
    // Address of the sending participant. This value can always be set to 0 for an RS232 communication,
    // since it is a 1 to 1 connection and hence the participants are unique.
    [simple int 8 transmitterAddress ]
    // Receiver's address. This value can always be set to 0 for an RS232 communication, since it is a 1 to 1
    // connection and hence the participants are unique.
    [simple int 8 receiverAddress ]
    // Number of the frame sent. Once the number 255 has been sent, it starts again from 0. The receiver checks this
    // number with an internal counter.
    [simple int 8 fragmentNumber ]
    // The max. length of the AMS packet to be sent is 255. If larger AMS packets are to be sent then they have to be
    // fragmented (not published at the moment).
    [simple int 8 length ]
    [simple uint 16 crc ]
]

// An AMS packet can be transferred via RS232 with the help of an AMS serial frame.
// The actual AMS packet is in the user data field of the frame.
// The max. length of the AMS packet is limited to 255 bytes.
// Therefore the max. size of an AMS serial frame is 263 bytes.
// The fragment number is compared with an internal counter by the receiver.
// The frame number is simply accepted and not checked when receiving the first AMS frame or in case a timeout is
// exceeded. The CRC16 algorithm is used for calculating the checksum.
// @see [TwinCAT AMS via RS232 Specification](https://infosys.beckhoff.com/content/1033/tcadsamsserialspec/html/tcamssericalspec_amsframe.htm?id=8115637053270715044)
[type AmsSerialFrame
    // Id for detecting an AMS serial frame.
    [simple uint 16 magicCookie ]
    // Address of the sending participant. This value can always be set to 0 for an RS232 communication,
    // since it is a 1 to 1 connection and hence the participants are unique.
    [simple int 8 transmitterAddress ]
    // Receiver's address. This value can always be set to 0 for an RS232 communication, since it is a 1 to 1
    // connection and hence the participants are unique.
    [simple int 8 receiverAddress ]
    // Number of the frame sent. Once the number 255 has been sent, it starts again from 0. The receiver checks this
    // number with an internal counter.
    [simple int 8 fragmentNumber ]
    // The max. length of the AMS packet to be sent is 255. If larger AMS packets are to be sent then they have to be
    // fragmented (not published at the moment).
    [simple int 8 length ]
    // The AMS packet to be sent.
    [simple AmsPacket userdata ]
    [simple uint 16 crc ]
]

// In case the transmitter does not receive a valid acknowledgement after multiple transmission, then a reset frame is
// sent. In this way the receiver is informed that a new communication is running and the receiver then accepts the
// fragment number during the next AMS-Frame, without carrying out a check.
[type AmsSerialResetFrame
    // Id for detecting an AMS serial frame.
    [simple uint 16 magicCookie ]
    // Address of the sending participant. This value can always be set to 0 for an RS232 communication,
    // since it is a 1 to 1 connection and hence the participants are unique.
    [simple int 8 transmitterAddress ]
    // Receiver's address. This value can always be set to 0 for an RS232 communication, since it is a 1 to 1
    // connection and hence the participants are unique.
    [simple int 8 receiverAddress ]
    // Number of the frame sent. Once the number 255 has been sent, it starts again from 0. The receiver checks this
    // number with an internal counter.
    [simple int 8 fragmentNumber ]
    // The max. length of the AMS packet to be sent is 255. If larger AMS packets are to be sent then they have to be
    // fragmented (not published at the moment).
    [simple int 8 length ]
    [simple uint 16 crc ]
]

////////////////////////////////////////////////////////////////
// AMS Common
////////////////////////////////////////////////////////////////

[discriminatedType AmsPacket
    // AMS Header 32 bytes The AMS/TCP-Header contains the addresses of the transmitter and receiver. In addition the AMS error code , the ADS command Id and some other information.
    // This is the AmsNetId of the station, for which the packet is intended. Remarks see below.
    [simple AmsNetId targetAmsNetId ]
    // This is the AmsPort of the station, for which the packet is intended.
    [simple uint 16 targetAmsPort ]
    // This contains the AmsNetId of the station, from which the packet was sent.
    [simple AmsNetId sourceAmsNetId ]
    // This contains the AmsPort of the station, from which the packet was sent.
    [simple uint 16 sourceAmsPort ]
    // 2 bytes.
    [discriminator CommandId commandId ]
    // 2 bytes. (I set these as constants in order to minimize the input needed for creating requests)
    [const bit initCommand false ]
    [const bit updCommand false ]
    [const bit timestampAdded false ]
    [const bit highPriorityCommand false ]
    [const bit systemCommand false ]
    [const bit adsCommand true ]
    [const bit noReturn false ]
    [discriminator bit response ]
    [const bit broadcast false ]
    [reserved int 7 '0x0' ]
    // 4 bytes Size of the data range. The unit is byte.
    [implicit uint 32 length 'lengthInBytes - 32' ]
    // 4 bytes AMS error number. See ADS Return Codes.
    [simple uint 32 errorCode ]
    // free usable field of 4 bytes
    // 4 bytes Free usable 32 bit array. Usually this array serves to send an Id. This Id makes is possible to assign a received response to a request, which was sent before.
    [simple uint 32 invokeId ]
    // The payload
    // TODO: In case of an error code that is not 0, we might not have a payload at all
    [typeSwitch errorCode, commandId, response
        ['0x00000000', 'INVALID', 'false' AdsInvalidRequest]
        ['0x00000000', 'INVALID', 'true' AdsInvalidResponse]
        ['0x00000000', 'ADS_READ_DEVICE_INFO', 'false' AdsReadDeviceInfoRequest]
        ['0x00000000', 'ADS_READ_DEVICE_INFO', 'true' AdsReadDeviceInfoResponse
            // 4 bytes ADS error number.
            [simple ReturnCode result]
            // Version 1 byte Major version number
            [simple uint 8 majorVersion]
            // Version 1 byte Minor version number
            [simple uint 8 minorVersion]
            // Build 2 bytes Build number
            [simple uint 16 version]
            // Name 16 bytes Name of ADS device
            [array byte device count '16']
        ]
        ['0x00000000', 'ADS_READ', 'false' AdsReadRequest
            // 4 bytes Index Group of the data which should be read.
            [simple uint 32 indexGroup]
            // 4 bytes Index Offset of the data which should be read.
            [simple uint 32 indexOffset]
            // 4 bytes Length of the data (in bytes) which should be read.
            [simple uint 32 length]
        ]
        ['0x00000000', 'ADS_READ', 'true' AdsReadResponse
            // 4 bytes ADS error number
            [simple ReturnCode result]
            // 4 bytes Length of data which are supplied back.
            [implicit uint 32 length 'COUNT(data)']
            // n bytes Data which are supplied back.
            [array byte data count 'length']
        ]
        ['0x00000000', 'ADS_WRITE', 'false' AdsWriteRequest
            // 4 bytes Index Group of the data which should be written.
            [simple uint 32 indexGroup]
            // 4 bytes Index Offset of the data which should be written.
            [simple uint 32 indexOffset]
            // 4 bytes Length of the data (in bytes) which should be written.
            [implicit uint 32 length 'COUNT(data)']
            // n bytes Data which are written in the ADS device.
            [array byte data count 'length']
        ]
        ['0x00000000', 'ADS_WRITE', 'true' AdsWriteResponse
            // 4 bytes ADS error number
            [simple ReturnCode result]
        ]
        ['0x00000000', 'ADS_READ_STATE', 'false' AdsReadStateRequest]
        ['0x00000000', 'ADS_READ_STATE', 'true' AdsReadStateResponse
            // 4 bytes ADS error number
            [simple ReturnCode result]
            // 2 bytes New ADS status (see data type ADSSTATE of the ADS-DLL).
            [simple uint 16 adsState]
            // 2 bytes New device status.
            [simple uint 16 deviceState]
        ]
        ['0x00000000', 'ADS_WRITE_CONTROL', 'false' AdsWriteControlRequest
            // 2 bytes New ADS status (see data type ADSSTATE of the ADS-DLL).
            [simple uint 16 adsState]
            // 2 bytes New device status.
            [simple uint 16 deviceState]
            // 4 bytes Length of data in byte.
            [implicit uint 32 length 'COUNT(data)']
            // n bytes Additional data which are sent to the ADS device
            [array byte data count 'length']
        ]
        ['0x00000000', 'ADS_WRITE_CONTROL', 'true' AdsWriteControlResponse
            // 4 bytes ADS error number
            [simple ReturnCode result]
        ]
        [ErrorResponse ]
    ]
]
