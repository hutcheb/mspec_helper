[type TestProtocol
    [simple uint 8 'version']
    [simple uint 16 'length']
    [array int 8 'data' count 'length']
]

[type SimpleMessage
    [simple uint 8 'messageType']
    [simple uint 16 'messageId']
    [simple string 'content']
]

[discriminatedType Message
    [discriminator uint 8 'messageType']
    [typeSwitch messageType
        ['0x01' SimpleMessage
            [simple uint 16 'messageId']
            [simple string 'content']
        ]
        ['0x02' ComplexMessage
            [simple uint 16 'messageId']
            [array uint 8 'payload' count 'length']
        ]
    ]
]
