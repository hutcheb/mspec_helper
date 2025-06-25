/*
 * Excerpt from S7 protocol definition
 * Based on the actual PLC4X S7 mspec file
 */

[type TPKTPacket byteOrder='BIG_ENDIAN'
    [const uint 8 protocolId 0x03]
    [reserved uint 8 '0x00']
    [implicit uint 16 len 'payload.lengthInBytes + 4']
    [simple COTPPacket('len - 4') payload]
]

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
    ]
    [array COTPParameter ('(headerLength + 1) - curPos') parameters length '(headerLength + 1) - curPos']
    [optional S7Message payload 'curPos < cotpLen']
]

[discriminatedType S7Message
    [const uint 8 protocolId 0x32]
    [discriminator uint 8 messageType]
    [reserved uint 16 '0x0000']
    [simple uint 16 tpduReference]
    [implicit uint 16 parameterLength 'parameter != null ? parameter.lengthInBytes : 0']
    [implicit uint 16 payloadLength 'payload != null ? payload.lengthInBytes : 0']
    [typeSwitch messageType
        ['0x01' S7MessageRequest]
        ['0x02' S7MessageResponse
            [simple uint 8 errorClass]
            [simple uint 8 errorCode]
        ]
        ['0x03' S7MessageResponseData
            [simple uint 8 errorClass]
            [simple uint 8 errorCode]
        ]
    ]
    [optional S7Parameter('messageType') parameter 'parameterLength > 0']
    [optional S7Payload('messageType', 'parameter') payload 'payloadLength > 0']
]

[enum uint 8 COTPProtocolClass
    ['0x00' CLASS_0]
    ['0x10' CLASS_1]
    ['0x20' CLASS_2]
    ['0x30' CLASS_3]
    ['0x40' CLASS_4]
]

[enum uint 8 TransportSize (uint 8 code, uint 8 shortName, uint 8 sizeInBytes)
    ['0x01' BOOL ['0x01', 'X', '1']]
    ['0x02' BYTE ['0x02', 'B', '1']]
    ['0x03' WORD ['0x04', 'W', '2']]
    ['0x04' DWORD ['0x06', 'D', '4']]
    ['0x06' INT ['0x05', 'W', '2']]
    ['0x07' UINT ['0x05', 'W', '2']]
    ['0x0A' DINT ['0x07', 'D', '4']]
    ['0x0E' REAL ['0x08', 'D', '4']]
]
