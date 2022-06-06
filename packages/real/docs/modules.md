[@hoprnet/hopr-real](README.md) / Exports

# @hoprnet/hopr-real

## Table of contents

### Namespaces

- [real](modules/real.md)

### Functions

- [read\_file](modules.md#read_file)
- [write\_file](modules.md#write_file)

## Functions

### read\_file

▸ **read_file**(`file`): `Uint8Array`

Wrapper for reading file via WASM

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `file` | `string` | File path |

#### Returns

`Uint8Array`

#### Defined in

[src/io.ts:9](https://github.com/hoprnet/hoprnet/blob/master/packages/real/src/io.ts#L9)

___

### write\_file

▸ **write_file**(`file`, `data`): `void`

Wrapper for reading file via WASM.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `file` | `string` | File path |
| `data` | `Uint8Array` | Data to write to the file |

#### Returns

`void`

#### Defined in

[src/io.ts:18](https://github.com/hoprnet/hoprnet/blob/master/packages/real/src/io.ts#L18)