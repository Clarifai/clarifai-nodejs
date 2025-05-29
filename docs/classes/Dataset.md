[clarifai-nodejs](../README.md) / [Exports](../modules.md) / Dataset

# Class: Dataset

## Hierarchy

- `Lister`

  ↳ **`Dataset`**

## Table of contents

### Constructors

- [constructor](Dataset.md#constructor)

### Properties

- [STUB](Dataset.md#stub)
- [authHelper](Dataset.md#authhelper)
- [base](Dataset.md#base)
- [batchSize](Dataset.md#batchsize)
- [defaultPageSize](Dataset.md#defaultpagesize)
- [info](Dataset.md#info)
- [input](Dataset.md#input)
- [metadata](Dataset.md#metadata)
- [pat](Dataset.md#pat)
- [rootCertificatesPath](Dataset.md#rootcertificatespath)
- [userAppId](Dataset.md#userappid)

### Methods

- [convertStringToTimestamp](Dataset.md#convertstringtotimestamp)
- [createVersion](Dataset.md#createversion)
- [deleteVersion](Dataset.md#deleteversion)
- [grpcRequest](Dataset.md#grpcrequest)
- [listPagesData](Dataset.md#listpagesdata)
- [listPagesGenerator](Dataset.md#listpagesgenerator)
- [listVersions](Dataset.md#listversions)
- [uploadFromCSV](Dataset.md#uploadfromcsv)
- [uploadFromFolder](Dataset.md#uploadfromfolder)

## Constructors

### constructor

• **new Dataset**(`«destructured»`): [`Dataset`](Dataset.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `DatasetConfig` |

#### Returns

[`Dataset`](Dataset.md)

#### Overrides

Lister.constructor

#### Defined in

[src/client/dataset.ts:39](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/dataset.ts#L39)

## Properties

### STUB

• `Protected` **STUB**: `V2Stub`

#### Inherited from

Lister.STUB

#### Defined in

[src/client/base.ts:27](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/base.ts#L27)

___

### authHelper

• `Protected` **authHelper**: `ClarifaiAuthHelper`

#### Inherited from

Lister.authHelper

#### Defined in

[src/client/base.ts:26](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/base.ts#L26)

___

### base

• `Protected` **base**: `string`

#### Inherited from

Lister.base

#### Defined in

[src/client/base.ts:31](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/base.ts#L31)

___

### batchSize

• `Private` **batchSize**: `number` = `128`

#### Defined in

[src/client/dataset.ts:36](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/dataset.ts#L36)

___

### defaultPageSize

• **defaultPageSize**: `number`

#### Inherited from

Lister.defaultPageSize

#### Defined in

[src/client/lister.ts:10](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/lister.ts#L10)

___

### info

• `Private` **info**: `Dataset`

#### Defined in

[src/client/dataset.ts:35](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/dataset.ts#L35)

___

### input

• `Private` **input**: [`Input`](Input.md)

#### Defined in

[src/client/dataset.ts:37](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/dataset.ts#L37)

___

### metadata

• `Protected` **metadata**: [`string`, `string`][]

#### Inherited from

Lister.metadata

#### Defined in

[src/client/base.ts:28](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/base.ts#L28)

___

### pat

• `Protected` **pat**: `string`

#### Inherited from

Lister.pat

#### Defined in

[src/client/base.ts:29](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/base.ts#L29)

___

### rootCertificatesPath

• `Protected` **rootCertificatesPath**: `string`

#### Inherited from

Lister.rootCertificatesPath

#### Defined in

[src/client/base.ts:32](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/base.ts#L32)

___

### userAppId

• `Protected` **userAppId**: `UserAppIDSet`

#### Inherited from

Lister.userAppId

#### Defined in

[src/client/base.ts:30](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/base.ts#L30)

## Methods

### convertStringToTimestamp

▸ **convertStringToTimestamp**(`dateStr`): `Timestamp`

Converts a string to a Timestamp object.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `dateStr` | `string` | The string to convert. |

#### Returns

`Timestamp`

A Timestamp object representing the given date string.

#### Inherited from

Lister.convertStringToTimestamp

#### Defined in

[src/client/base.ts:100](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/base.ts#L100)

___

### createVersion

▸ **createVersion**(`«destructured»`): `Promise`\<`AsObject`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `description` | `string` |
| › `id` | `string` |
| › `metadata?` | `Record`\<`string`, `JavaScriptValue`\> |

#### Returns

`Promise`\<`AsObject`\>

#### Defined in

[src/client/dataset.ts:58](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/dataset.ts#L58)

___

### deleteVersion

▸ **deleteVersion**(`versionId`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `versionId` | `string` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/client/dataset.ts:91](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/dataset.ts#L91)

___

### grpcRequest

▸ **grpcRequest**\<`TRequest`, `TResponseObject`, `TResponse`\>(`endpoint`, `requestData`): `Promise`\<`TResponse`\>

Makes a gRPC request to the API.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `TRequest` | extends `Message` |
| `TResponseObject` | extends `Object` |
| `TResponse` | extends `Object` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `endpoint` | (`request`: `TRequest`, `metadata`: `Metadata`, `options`: `Partial`\<`CallOptions`\>) => `Promise`\<`TResponse`\> |
| `requestData` | `TRequest` |

#### Returns

`Promise`\<`TResponse`\>

A Promise resolving to the result of the gRPC method call.

#### Inherited from

Lister.grpcRequest

#### Defined in

[src/client/base.ts:77](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/base.ts#L77)

___

### listPagesData

▸ **listPagesData**\<`TRequest`, `TResponseObject`, `TResponse`\>(`endpoint`, `requestData`, `pageNo?`, `perPage?`): `Promise`\<`TResponse`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `TRequest` | extends `Message` |
| `TResponseObject` | extends `Object` |
| `TResponse` | extends `Object` |

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `endpoint` | (`request`: `TRequest`, `metadata`: `Metadata`, `options`: `Partial`\<`CallOptions`\>) => `Promise`\<`TResponse`\> | `undefined` |
| `requestData` | `TRequest` | `undefined` |
| `pageNo` | `number` | `1` |
| `perPage` | `number` | `undefined` |

#### Returns

`Promise`\<`TResponse`\>

#### Inherited from

Lister.listPagesData

#### Defined in

[src/client/lister.ts:87](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/lister.ts#L87)

___

### listPagesGenerator

▸ **listPagesGenerator**\<`TRequest`, `TResponseObject`, `TResponse`\>(`endpoint`, `requestData`, `pageNo?`, `perPage?`): `AsyncGenerator`\<`TResponse`, `void`, `unknown`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `TRequest` | extends `Message` |
| `TResponseObject` | extends `Object` |
| `TResponse` | extends `Object` |

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `endpoint` | (`request`: `TRequest`, `metadata`: `Metadata`, `options`: `Partial`\<`CallOptions`\>) => `Promise`\<`TResponse`\> | `undefined` |
| `requestData` | `TRequest` | `undefined` |
| `pageNo` | `number` | `1` |
| `perPage` | `number` | `undefined` |

#### Returns

`AsyncGenerator`\<`TResponse`, `void`, `unknown`\>

#### Inherited from

Lister.listPagesGenerator

#### Defined in

[src/client/lister.ts:23](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/lister.ts#L23)

___

### listVersions

▸ **listVersions**(`pageNo?`, `perPage?`): `AsyncGenerator`\<`AsObject`[], `void`, `unknown`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `pageNo?` | `number` |
| `perPage?` | `number` |

#### Returns

`AsyncGenerator`\<`AsObject`[], `void`, `unknown`\>

#### Defined in

[src/client/dataset.ts:109](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/dataset.ts#L109)

___

### uploadFromCSV

▸ **uploadFromCSV**(`«destructured»`): `Promise`\<`void`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `batchSize?` | `number` | `128` |
| › `csvPath` | `string` | `undefined` |
| › `csvType` | ``"url"`` \| ``"raw"`` \| ``"file"`` | `undefined` |
| › `inputType?` | ``"image"`` \| ``"text"`` \| ``"video"`` \| ``"audio"`` | `"text"` |
| › `labels?` | `boolean` | `true` |
| › `uploadProgressEmitter?` | [`InputBulkUpload`](../modules.md#inputbulkupload) | `undefined` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/client/dataset.ts:172](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/dataset.ts#L172)

___

### uploadFromFolder

▸ **uploadFromFolder**(`«destructured»`): `Promise`\<`void`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `batchSize?` | `number` | `undefined` |
| › `folderPath` | `string` | `undefined` |
| › `inputType` | ``"image"`` \| ``"text"`` | `undefined` |
| › `labels?` | `boolean` | `false` |
| › `uploadProgressEmitter?` | [`InputBulkUpload`](../modules.md#inputbulkupload) | `undefined` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/client/dataset.ts:134](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/dataset.ts#L134)
