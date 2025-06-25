# PLC4X MSpec Grammar Specification

## Overview

The MSpec (Message Specification) format is a domain-specific language used by Apache PLC4X to define protocol message structures for industrial communication protocols. This document provides a comprehensive specification of the MSpec grammar based on the ANTLR4 grammar file from the PLC4X project.

## File Structure

An MSpec file consists of zero or more complex type definitions:

```
file: complexTypeDefinition* EOF
```

## Complex Type Definitions

Complex types are the main building blocks of MSpec files. They are enclosed in square brackets and can be one of four types:

### 1. Type Definition
```
[type TypeName(parameters) attributes
    fieldDefinitions...
]
```

### 2. Discriminated Type Definition
```
[discriminatedType TypeName(parameters) attributes
    fieldDefinitions...
]
```

### 3. Enum Definition
```
[enum dataType TypeName(parameters) attributes
    enumValues...
]
```

### 4. Data I/O Definition
```
[dataIo TypeName(parameters) attributes
    dataIoTypeSwitch
]
```

## Field Definitions

Fields define the structure and behavior of data within types. All fields are enclosed in square brackets:

### Core Field Types

#### Simple Field
```
[simple dataType fieldName]
```
Defines a basic field with a specified data type.

#### Array Field
```
[array dataType fieldName loopType expression]
```
Defines an array field where:
- `loopType`: `count`, `length`, or `terminated`
- `expression`: defines the array size or termination condition

#### Const Field
```
[const dataType fieldName expectedValue]
```
Defines a field with a constant value that must match the expected value.

#### Reserved Field
```
[reserved dataType expectedValue]
```
Defines a reserved field that should contain the expected value but is not exposed.

#### Optional Field
```
[optional dataType fieldName condition?]
```
Defines a field that may or may not be present based on an optional condition.

#### Discriminator Field
```
[discriminator dataType fieldName]
```
Defines a field used for type discrimination in discriminated types.

#### Implicit Field
```
[implicit dataType fieldName serializeExpression]
```
Defines a field whose value is calculated during serialization.

#### Virtual Field
```
[virtual dataType fieldName valueExpression]
```
Defines a computed field that doesn't consume bytes from the stream.

### Advanced Field Types

#### Manual Field
```
[manual dataType fieldName parseExpression serializeExpression lengthExpression]
```
Defines a field with custom parsing and serialization logic.

#### Manual Array Field
```
[manualArray dataType fieldName loopType loopExpression parseExpression serializeExpression lengthExpression]
```
Defines an array field with custom parsing and serialization logic.

#### Checksum Field
```
[checksum dataType fieldName checksumExpression]
```
Defines a field containing a checksum value.

#### Padding Field
```
[padding dataType fieldName paddingValue timesPadding]
```
Defines padding bytes in the message structure.

#### Assert Field
```
[assert dataType fieldName condition]
```
Defines a field that must satisfy a specific condition.

#### Validation Field
```
[validation validationExpression description? shouldFail?]
```
Defines validation logic for the message.

#### Peek Field
```
[peek dataType fieldName offset?]
```
Defines a field that reads ahead without consuming bytes.

#### Unknown Field
```
[unknown dataType]
```
Defines a field for unknown or variable data.

#### Enum Field
```
[enum dataType fieldName enumFieldName]
```
Defines a field that references an enum value.

#### Abstract Field
```
[abstract dataType fieldName]
```
Defines an abstract field for inheritance.

## Data Types

MSpec supports various primitive data types:

### Bit Types
- `bit` - Single bit
- `byte` - 8-bit byte

### Integer Types
- `int size` - Signed integer (e.g., `int 16`, `int 32`)
- `uint size` - Unsigned integer (e.g., `uint 8`, `uint 16`)
- `vint` - Variable-length signed integer
- `vuint` - Variable-length unsigned integer

### Floating Point Types
- `float size` - Floating point (e.g., `float 32`, `float 64`)
- `ufloat size` - Unsigned floating point

### String Types
- `string size` - Fixed-length string
- `vstring length?` - Variable-length string

### Time Types
- `time` - Time value
- `date` - Date value
- `dateTime` - Date and time value

## Type Switch

Type switches enable conditional field definitions based on discriminator values:

```
[typeSwitch discriminatorField1, discriminatorField2
    ['value1', 'value2' TypeName
        fieldDefinitions...
    ]
    ['value3' AnotherTypeName
        fieldDefinitions...
    ]
]
```

## Expressions

Expressions are enclosed in single quotes and support:

### Literals
- Boolean: `true`, `false`
- Integer: `123`, `0xFF` (hex)
- Float: `3.14`
- String: `"text"`

### Operators
- Arithmetic: `+`, `-`, `*`, `/`, `%`, `^`
- Comparison: `==`, `!=`, `>`, `<`, `>=`, `<=`
- Logical: `&&`, `||`, `!`
- Bitwise: `&`, `|`, `>>`, `<<`
- Ternary: `condition ? value1 : value2`

### References
- Field references: `fieldName`
- Nested references: `field.subfield`
- Array indexing: `array[index]`
- Method calls: `function(args)`

## Attributes

Attributes provide additional metadata and are specified as key-value pairs:

```
[field dataType fieldName attribute1='value1' attribute2='value2']
```

Common attributes include:
- `encoding='UTF-8'` - Character encoding for strings
- `byteOrder='BIG_ENDIAN'` - Byte order specification

## Comments

MSpec supports both line and block comments:

```
// Line comment
/* Block comment */
```

## Example

```mspec
[type ExampleMessage byteOrder='BIG_ENDIAN'
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
```

This specification provides the foundation for implementing language server features like syntax highlighting, validation, auto-completion, and semantic analysis for MSpec files.
