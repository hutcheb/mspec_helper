/*
 * Simple MSpec example demonstrating basic syntax
 */

[type SimpleMessage byteOrder='BIG_ENDIAN'
    [const uint 8 messageType 0x01]
    [simple uint 16 messageId]
    [implicit uint 16 payloadLength 'payload.lengthInBytes']
    [array byte payload count 'payloadLength']
    [checksum uint 16 crc 'STATIC_CALL("calculateCrc", payload)']
]

[enum uint 8 MessageType
    ['0x01' REQUEST]
    ['0x02' RESPONSE]
    ['0x03' ERROR]
]

[discriminatedType ProtocolMessage byteOrder='BIG_ENDIAN'
    [discriminator uint 8 messageType]
    [typeSwitch messageType
        ['0x01' RequestMessage
            [simple uint 16 requestId]
            [simple string 32 command]
        ]
        ['0x02' ResponseMessage
            [simple uint 16 requestId]
            [simple uint 8 status]
            [optional string 64 data 'status == 0']
        ]
        ['0x03' ErrorMessage
            [simple uint 16 errorCode]
            [simple string 128 errorMessage]
        ]
    ]
]

[type Header
    [const uint 32 magic 0x12345678]
    [simple uint 8 version]
    [reserved uint 8 0x00]
    [simple uint 16 flags]
]

[type ComplexMessage
    [simple Header header]
    [simple ProtocolMessage message]
]
