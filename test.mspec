[type SimpleTest
    [simple uint 16 length]
    [simple string message]
]

[enum MessageType (uint 8)
    ['0x01' REQUEST]
    ['0x02' RESPONSE]
]

[discriminatedType TestMessage (uint 8 messageType)
    [discriminator uint 8 messageType]
    [typeSwitch messageType
        ['0x01' RequestMessage
            [simple uint 32 requestId]
            [simple string payload]
        ]
        ['0x02' ResponseMessage
            [simple uint 32 requestId]
            [simple uint 8 status]
        ]
    ]
]
