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

////////////////////////////////////////////////////////////////
// IsoOnTcp/TPKT
////////////////////////////////////////////////////////////////

[type TPKTPacket byteOrder='BIG_ENDIAN'
    [const uint 8 protocolId 0x03]
    [reserved uint 8 '0x00']
    [implicit uint 16 len 'payload.lengthInBytes + 4']
    [simple COTPPacket('len - 4') payload]
]

////////////////////////////////////////////////////////////////
// COTP
////////////////////////////////////////////////////////////////

[discriminatedType COTPPacket (uint 16 cotpLen)
    [implicit uint 8 headerLength 'lengthInBytes - (((payload != null) ? payload.lengthInBytes : 0) + 1)']
    [discriminator uint 8 tpduCode]
    [typeSwitch tpduCode
        ['0xF0' COTPPacketData
            [simple bit eot]
            [simple uint 7 tpduRef]
        ]
        ['0xE0' COTPPacketConnectionRequest
            [simple uint 16 destinationReference]
            [simple uint 16 sourceReference]
            [simple COTPProtocolClass protocolClass]
        ]
        ['0xD0' COTPPacketConnectionResponse
            [simple uint 16 destinationReference]
            [simple uint 16 sourceReference]
            [simple COTPProtocolClass protocolClass]
        ]
        ['0x80' COTPPacketDisconnectRequest
            [simple uint 16 destinationReference]
            [simple uint 16 sourceReference]
            [simple COTPProtocolClass protocolClass]
        ]
        ['0xC0' COTPPacketDisconnectResponse
            [simple uint 16 destinationReference]
            [simple uint 16 sourceReference]
        ]
        ['0x70' COTPPacketTpduError
            [simple uint 16 destinationReference]
            [simple uint 8 rejectCause]
        ]
    ]
    [array COTPParameter ('(headerLength + 1) - curPos') parameters length '(headerLength + 1) - curPos']
    [optional S7Message payload 'curPos < cotpLen']
]

[discriminatedType COTPParameter (uint 8 rest)
    [discriminator uint 8 parameterType]
    [implicit uint 8 parameterLength 'lengthInBytes - 2']
    [typeSwitch parameterType
        ['0xC0' COTPParameterTpduSize
            [simple COTPTpduSize tpduSize]
        ]
        ['0xC1' COTPParameterCallingTsap
            [simple uint 16 tsapId]
        ]
        ['0xC2' COTPParameterCalledTsap
            [simple uint 16 tsapId]
        ]
        ['0xC3' COTPParameterChecksum
            [simple uint 8 crc]
        ]
        ['0xE0' COTPParameterDisconnectAdditionalInformation
            [array byte data count 'rest']
        ]
        ['0x00' COTPParameterUnknown
            [array byte data count 'rest']
        ]
    ]
]

////////////////////////////////////////////////////////////////
// S7
////////////////////////////////////////////////////////////////

[discriminatedType S7Message
    [const uint 8 protocolId 0x32]
    [discriminator uint 8 messageType]
    [reserved uint 16 '0x0000']
    [simple uint 16 tpduReference]
    [implicit uint 16 parameterLength 'parameter != null ? parameter.lengthInBytes : 0']
    [implicit uint 16 payloadLength 'payload != null ? payload.lengthInBytes : 0']
    [typeSwitch messageType
        ['0x01' S7MessageRequest
        ]
        ['0x02' S7MessageResponse
            [simple uint 8 errorClass]
            [simple uint 8 errorCode]
        ]
        ['0x03' S7MessageResponseData
            [simple uint 8 errorClass]
            [simple uint 8 errorCode]
        ]
        ['0x07' S7MessageUserData
        ]
    ]
    [optional S7Parameter ('messageType') parameter 'parameterLength > 0']
    [optional S7Payload ('messageType', 'parameter') payload 'payloadLength > 0' ]
]

////////////////////////////////////////////////////////////////
// Parameters

[discriminatedType S7Parameter (uint 8 messageType)
    [discriminator uint 8 parameterType]
    [typeSwitch parameterType,messageType
        ['0xF0' S7ParameterSetupCommunication
            [reserved uint 8 '0x00']
            [simple uint 16 maxAmqCaller]
            [simple uint 16 maxAmqCallee]
            [simple uint 16 pduLength]
        ]
        ['0x04','0x01' S7ParameterReadVarRequest
            [implicit uint 8 numItems 'COUNT(items)']
            [array S7VarRequestParameterItem items count 'numItems']
        ]
        ['0x04','0x03' S7ParameterReadVarResponse
            [simple uint 8 numItems]
        ]
        ['0x05','0x01' S7ParameterWriteVarRequest
            [implicit uint 8 numItems 'COUNT(items)']
            [array S7VarRequestParameterItem items count 'numItems']
        ]
        ['0x05','0x03' S7ParameterWriteVarResponse
            [simple uint 8 numItems]
        ]
        ['0x00','0x07' S7ParameterUserData
            [implicit uint 8 numItems 'COUNT(items)']
            [array S7ParameterUserDataItem items count 'numItems']
        ]
        ['0x01','0x07' S7ParameterModeTransition
            [reserved uint 16 '0x0010']
            [implicit uint 8 itemLength 'lengthInBytes - 2']
            [simple uint 8 method]
            [simple uint 4 cpuFunctionType]
            [simple uint 4 cpuFunctionGroup]
            [simple uint 8 currentMode]
            [simple uint 8 sequenceNumber]
        ]
    ]
]

[discriminatedType S7VarRequestParameterItem
    [discriminator uint 8 itemType]
    [typeSwitch itemType
        ['0x12' S7VarRequestParameterItemAddress
            [implicit uint 8 itemLength 'address.lengthInBytes']
            [simple S7Address address]
        ]
    ]
]

[discriminatedType S7Address
    [discriminator uint 8 addressType]
    [typeSwitch addressType
        ['0x10' S7AddressAny
            [enum TransportSize transportSize code]
            [simple uint 16 numberOfElements]
            [simple uint 16 dbNumber]
            [simple MemoryArea area]
            [reserved uint 5 '0x00']
            [simple uint 16 byteAddress]
            [simple uint 3 bitAddress]
        ]
    ]
]

[discriminatedType S7ParameterUserDataItem
    [discriminator uint 8 itemType]
    [typeSwitch itemType
        ['0x12' S7ParameterUserDataItemCPUFunctions
            [implicit uint 8 itemLength 'lengthInBytes - 2']
            [simple uint 8 method]
            [simple uint 4 cpuFunctionType]
            [simple uint 4 cpuFunctionGroup]
            [simple uint 8 cpuSubfunction]
            [simple uint 8 sequenceNumber]
            [optional uint 8 dataUnitReferenceNumber '(cpuFunctionType == 8) || ((cpuFunctionType == 0) && (cpuFunctionGroup == 2))']
            [optional uint 8 lastDataUnit '(cpuFunctionType == 8) || ((cpuFunctionType == 0) && (cpuFunctionGroup == 2))']
            [optional uint 16 errorCode '(cpuFunctionType == 8) || ((cpuFunctionType == 0) && (cpuFunctionGroup == 2))']
        ]
    ]
]

/*
 * SZL is used as a reference to the list of system states.
 * Siemens literature and forums use SZL or SSL interchangeably.
 * SZL = System Zustand Liste
 * SSL = System Status List
 */
[type SzlId
    [simple SzlModuleTypeClass typeClass]
    [simple uint 4 sublistExtract]
    [simple SzlSublist sublistList]
]

[type SzlDataTreeItem
    [simple uint 16 itemIndex]
    [array byte mlfb count '20']
    [simple uint 16 moduleTypeId]
    [simple uint 16 ausbg]
    [simple uint 16 ausbe]
]

////////////////////////////////////////////////////////////////
// Payloads

[discriminatedType S7Payload (uint 8 messageType, S7Parameter parameter)
    [typeSwitch parameter.parameterType, messageType
        ['0x04','0x03' S7PayloadReadVarResponse
            [array S7VarPayloadDataItem items count 'CAST(parameter, "S7ParameterReadVarResponse").numItems']
        ]
        ['0x05','0x01' S7PayloadWriteVarRequest
            [array S7VarPayloadDataItem items count 'COUNT(CAST(parameter, "S7ParameterWriteVarRequest").items)']
        ]
        ['0x05','0x03' S7PayloadWriteVarResponse
            [array S7VarPayloadStatusItem items count 'CAST(parameter, "S7ParameterWriteVarResponse").numItems']
        ]
        ['0x00','0x07' S7PayloadUserData
            [array S7PayloadUserDataItem('CAST(CAST(parameter, "S7ParameterUserData").items[0], "S7ParameterUserDataItemCPUFunctions").cpuFunctionGroup', 'CAST(CAST(parameter, "S7ParameterUserData").items[0], "S7ParameterUserDataItemCPUFunctions").cpuFunctionType', 'CAST(CAST(parameter, "S7ParameterUserData").items[0], "S7ParameterUserDataItemCPUFunctions").cpuSubfunction') items count 'COUNT(CAST(parameter, "S7ParameterUserData").items)']
        ]
    ]
]

// This is actually not quite correct as depending pon the transportSize the length is either defined in bits or bytes.
//@param hasNext In the serialization process, if you have multiple write
// requests the last element does not require padding.
[type S7VarPayloadDataItem
    [simple DataTransportErrorCode returnCode]
    [simple DataTransportSize transportSize]
    [implicit uint 16 dataLength 'COUNT(data) * ((transportSize == DataTransportSize.BIT) ? 1 : (transportSize.sizeInBits ? 8 : 1))']
    [array byte data count 'transportSize.sizeInBits ? CEIL(dataLength / 8.0) : dataLength']
    [padding uint 8 pad '0x00' '(!_lastItem) ? (COUNT(data) % 2) : 0']
]

[type S7VarPayloadStatusItem
    [simple DataTransportErrorCode returnCode]
]

////////////////////////////////////////////////////////////////
// Event 7 Alarms Types
////////////////////////////////////////////////////////////////

//Under test
[discriminatedType S7DataAlarmMessage(uint 4 cpuFunctionType)
    [const uint 8 functionId 0x00]
    [const uint 8 numberMessageObj 0x01]
    [typeSwitch cpuFunctionType
        ['0x04' S7MessageObjectRequest
            [const uint 8 variableSpec 0x12]
            [const uint 8 length 0x08]
            [simple SyntaxIdType syntaxId]
            [reserved uint 8 '0x00']
            [simple QueryType queryType]
            [reserved uint 8 '0x34']
            [simple AlarmType alarmType]
        ]
        ['0x08' S7MessageObjectResponse
            [simple DataTransportErrorCode returnCode]
            [simple DataTransportSize transportSize]
            [reserved uint 8 '0x00']
        ]
    ]
]

//TODO: The calculation must be modified to include the type
// . if it is type 0x07(REAL) or 0x09 (OCTET_STRING), the length is indicated
// . another type uses scrolling
// . verify calculation with the other types
[type AssociatedValueType
    [simple DataTransportErrorCode returnCode]
    [simple DataTransportSize transportSize]
    //[manual uint 16 valueLength 'STATIC_CALL("rightShift3", readBuffer)' 'STATIC_CALL("leftShift3", writeBuffer, valueLength)' '16']
    [manual uint 16 valueLength 'STATIC_CALL("rightShift3", readBuffer, transportSize)' 'STATIC_CALL("leftShift3", writeBuffer, valueLength)' '2']
    [array uint 8 data count 'STATIC_CALL("eventItemLength", readBuffer, valueLength)']
]

[type AssociatedQueryValueType
    [simple DataTransportErrorCode returnCode]
    [simple DataTransportSize transportSize]
    [simple uint 16 valueLength]
    [array uint 8 data count 'valueLength']
]

[type DateAndTime
    [simple uint 8 year encoding='"BCD"']
    [simple uint 8 month encoding='"BCD"']
    [simple uint 8 day encoding='"BCD"']
    [simple uint 8 hour encoding='"BCD"']
    [simple uint 8 minutes encoding='"BCD"']
    [simple uint 8 seconds encoding='"BCD"']
    [simple uint 12 msec encoding='"BCD"']
    [simple uint 4 dow encoding='"BCD"']
]

[type State
    [simple bit SIG_8]
    [simple bit SIG_7]
    [simple bit SIG_6]
    [simple bit SIG_5]
    [simple bit SIG_4]
    [simple bit SIG_3]
    [simple bit SIG_2]
    [simple bit SIG_1]
]

[type AlarmMessageObjectPushType
    [const uint 8 variableSpec 0x12]
    [simple uint 8 lengthSpec]
    [simple SyntaxIdType syntaxId]
    [simple uint 8 numberOfValues]
    [simple uint 32 eventId]
    [simple State eventState]
    [simple State localState]
    [simple State ackStateGoing]
    [simple State ackStateComing]
    [array AssociatedValueType AssociatedValues count 'numberOfValues' ]
]

[type AlarmMessageAckObjectPushType
    [const uint 8 variableSpec 0x12]
    [simple uint 8 lengthSpec]
    [simple SyntaxIdType syntaxId]
    [simple uint 8 numberOfValues]
    [simple uint 32 eventId]
    [simple State ackStateGoing]
    [simple State ackStateComing]
]

[type AlarmMessagePushType
    [simple DateAndTime timeStamp]
    [simple uint 8 functionId]
    [simple uint 8 numberOfObjects]
    [array AlarmMessageObjectPushType messageObjects count 'numberOfObjects' ]
]

[type AlarmMessageAckPushType
    [simple DateAndTime timeStamp]
    [simple uint 8 functionId]
    [simple uint 8 numberOfObjects]
    [array AlarmMessageAckObjectPushType messageObjects count 'numberOfObjects' ]
]

//TODO: Apply for S7-300
// This seems to be a duplicate definition, however this definition was never used, so I commented it out
/*[type AlarmMessageQueryType(uint 16 dataLength)
    [simple uint 8 functionId]
    [simple uint 8 numberOfObjects]
    [simple DataTransportErrorCode returnCode]
    [simple DataTransportSize transportSize]
    [const uint 16 dataLength 0xFFFF]
    [array AlarmMessageObjectQueryType messageObjects count 'STATIC_CALL("countAMOQT", readBuffer, dataLength)' ]
]*/

[type AlarmMessageQueryType
    [simple uint 8 functionId]
    [simple uint 8 numberOfObjects]
    [simple DataTransportErrorCode returnCode]
    [simple DataTransportSize transportSize]
    [const uint 16 dataLength 0xFFFF]
    [array AlarmMessageObjectQueryType messageObjects count 'numberOfObjects' ]
]

//TODO: Apply for S7-400
[type Alarm8MessageQueryType
    [simple uint 8 functionId]
    [simple uint 8 numberOfObjects]
    [simple DataTransportErrorCode returnCode]
    [simple DataTransportSize transportSize]
    [simple uint 16 byteCount]
    [array AlarmMessageObjectQueryType messageObjects count 'byteCount / 12' ]
]

//TODO: Check for Alarm_8
[type AlarmMessageObjectQueryType
    [simple uint 8 lengthDataset]
    [reserved uint 16 '0x0000']
    [const uint 8 variableSpec 0x12]
    [simple State eventState]
    [simple State ackStateGoing]
    [simple State ackStateComing]
    [simple DateAndTime timeComing]
    [simple AssociatedValueType valueComing]
    [simple DateAndTime timeGoing]
    [simple AssociatedValueType valueGoing]
]

[type AlarmMessageObjectAckType
    [const uint 8 variableSpec 0x12]
    [const uint 8 length 0x08]
    [simple SyntaxIdType syntaxId]
    [simple uint 8 numberOfValues]
    [simple uint 32 eventId]
    [simple State ackStateGoing]
    [simple State ackStateComing]
]

[type AlarmMessageAckType
    [simple uint 8 functionId]
    [simple uint 8 numberOfObjects]
    [array AlarmMessageObjectAckType messageObjects count 'numberOfObjects' ]
]

[type AlarmMessageAckResponseType
    [simple uint 8 functionId]
    [simple uint 8 numberOfObjects]
    [array uint 8 messageObjects count 'numberOfObjects' ]
]

////////////////////////////////////////////////////////////////
// Cycle service Payloads
////////////////////////////////////////////////////////////////

//Under test
[discriminatedType CycServiceItemType
    [const uint 8 functionId 0x12]
    [simple uint 8 byteLength]
    [simple uint 8 syntaxId]
    [typeSwitch syntaxId
        ['0x10' CycServiceItemAnyType
            //[simple TransportSize transportSize]
            [enum TransportSize transportSize code]
            [simple uint 16 length]
            [simple uint 16 dbNumber]
            [simple MemoryArea memoryArea]
            [simple uint 24 address]
        ]
        ['0xb0' CycServiceItemDbReadType
            [simple uint 8 numberOfAreas]
            [array SubItem items count 'numberOfAreas']
        ]
    ]
]

[type SubItem
    [simple uint 8 bytesToRead]
    [simple uint 16 dbNumber]
    [simple uint 16 startAddress]
]

////////////////////////////////////////////////////////////////
// DataItem by Function Group Type:
// 0x00 MODE_TRANSITION
// 0x04 CPU_FUNCTIONS
// 0x08 TYPE_RES
//
// DataItem by Function Type:
// 0x00 PUSH
// 0x04 REQUEST
// 0x08 RESPONSE
//
// DataItem by Sub Function Type:
// 0x01 CPU_READSZL
// 0x02 CPU_MSGS
// 0x03 CPU_DIAGMSG
// 0x05 ALARM8_IND
// 0x06 NOTIFY_IND
// 0x07 ALARM8LOCK
// 0x08 ALARM8UNLOCK
// 0x0b ALARMACK
// 0x0c ALARMACK_IND
// 0x0d ALARM8LOCK_IND
// 0x0e ALARM8UNLOCK_IND
// 0x11 ALARMSQ_IND
// 0x12 ALARMS_IND
// 0x13 ALARMQUERY
// 0x16 NOTIFY8_IND
////////////////////////////////////////////////////////////////

[discriminatedType S7PayloadUserDataItem(uint 4 cpuFunctionGroup, uint 4 cpuFunctionType, uint 8 cpuSubfunction)
    [simple DataTransportErrorCode returnCode]
    [simple DataTransportSize transportSize]
    [simple uint 16 dataLength]
    //[implicit uint 16 dataLength 'lengthInBytes - 4']
    [typeSwitch cpuFunctionGroup, cpuFunctionType, cpuSubfunction, dataLength
        ['0x02', '0x00', '0x01' S7PayloadUserDataItemCyclicServicesPush
            [simple uint 16 itemsCount]
            [array AssociatedValueType items count 'itemsCount']
        ]
        ['0x02', '0x00', '0x05' S7PayloadUserDataItemCyclicServicesChangeDrivenPush
            [simple uint 16 itemsCount]
            [array AssociatedQueryValueType items count 'itemsCount']
        ]
        ['0x02', '0x04', '0x01' S7PayloadUserDataItemCyclicServicesSubscribeRequest
            [simple uint 16 itemsCount]
            [simple TimeBase timeBase]
            [simple uint 8 timeFactor]
            [array CycServiceItemType item count 'itemsCount']
        ]
        ['0x02', '0x04', '0x04' S7PayloadUserDataItemCyclicServicesUnsubscribeRequest
            [simple uint 8 function]
            [simple uint 8 jobId]
        ]
        ['0x02', '0x08', '0x01' S7PayloadUserDataItemCyclicServicesSubscribeResponse
            [simple uint 16 itemsCount]
            [array AssociatedValueType items count 'itemsCount']
        ]
        ['0x02', '0x08', '0x04' S7PayloadUserDataItemCyclicServicesUnsubscribeResponse
        ]
        ['0x02', '0x08', '0x05', '0x00' S7PayloadUserDataItemCyclicServicesErrorResponse
        ]
        ['0x02', '0x08', '0x05' S7PayloadUserDataItemCyclicServicesChangeDrivenSubscribeResponse
            [simple uint 16 itemsCount]
            [array AssociatedQueryValueType items count 'itemsCount']
        ]
        //USER and SYSTEM Messages
        ['0x04', '0x00', '0x03' S7PayloadDiagnosticMessage
            [simple uint 16 eventId]
            [simple uint 8 priorityClass]
            [simple uint 8 obNumber]
            [simple uint 16 datId]
            [simple uint 16 info1]
            [simple uint 32 info2]
            [simple DateAndTime timeStamp]
        ]
        //PUSH message reception S7300 & S7400 (ALARM_SQ, ALARM_S, ALARM_SC, ...)
        ['0x04', '0x00', '0x05' S7PayloadAlarm8
            [simple AlarmMessagePushType alarmMessage]
        ]
        ['0x04', '0x00', '0x06' S7PayloadNotify
            [simple AlarmMessagePushType alarmMessage]
        ]
        ['0x04', '0x00', '0x0c' S7PayloadAlarmAckInd
            [simple AlarmMessageAckPushType alarmMessage]
        ]
        ['0x04', '0x00', '0x11' S7PayloadAlarmSQ
            [simple AlarmMessagePushType alarmMessage]
        ]
        ['0x04', '0x00', '0x12' S7PayloadAlarmS
            [simple AlarmMessagePushType alarmMessage]
        ]
        ['0x04', '0x00', '0x13' S7PayloadAlarmSC
            [simple AlarmMessagePushType alarmMessage]
        ]
        ['0x04', '0x00', '0x16' S7PayloadNotify8
            [simple AlarmMessagePushType alarmMessage]
        ]
        //Request for specific functions of the SZL system
        ['0x04','0x04', '0x01', '0x00' S7PayloadUserDataItemCpuFunctionReadSzlNoDataRequest
        ]
        ['0x04', '0x04', '0x01' S7PayloadUserDataItemCpuFunctionReadSzlRequest
            [simple SzlId szlId]
            [simple uint 16 szlIndex]
        ]
        //['0x04', '0x08', '0x01' S7PayloadUserDataItemCpuFunctionReadSzlResponse
        //    [simple SzlId szlId]
        //    [simple uint 16 szlIndex]
        //    [const uint 16 szlItemLength 28]
        //    [implicit uint 16 szlItemCount 'COUNT(items)']
        //    [array SzlDataTreeItem items count 'szlItemCount']
        //]
        ['0x04', '0x08', '0x01' S7PayloadUserDataItemCpuFunctionReadSzlResponse(uint 16 dataLength)
            [array byte items count 'dataLength']
        ]
        //Subscription to PUSH messages
        ['0x04', '0x04', '0x02' S7PayloadUserDataItemCpuFunctionMsgSubscriptionRequest
            [simple uint 8 subscription]
            [reserved uint 8 '0x00']
            [simple string 64 magicKey ]
            [optional AlarmStateType alarmtype 'subscription >= 128']
            [optional uint 8 reserve 'subscription >= 128']
        ]
        ['0x04', '0x08', '0x02', '0x00' S7PayloadUserDataItemCpuFunctionMsgSubscriptionResponse]
        ['0x04', '0x08', '0x02', '0x02' S7PayloadUserDataItemCpuFunctionMsgSubscriptionSysResponse
            [simple uint 8 result]
            [simple uint 8 reserved01]
        ]
        ['0x04', '0x08', '0x02', '0x05' S7PayloadUserDataItemCpuFunctionMsgSubscriptionAlarmResponse
            [simple uint 8 result]
            [simple uint 8 reserved01]
            [simple AlarmType alarmType]
            [simple uint 8 reserved02]
            [simple uint 8 reserved03]
        ]
    ]
]
