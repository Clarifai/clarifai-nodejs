[clarifai-nodejs](../README.md) / [Exports](../modules.md) / Search

# Class: Search

## Hierarchy

- `Lister`

  ↳ **`Search`**

## Table of contents

### Constructors

- [constructor](Search.md#constructor)

### Properties

- [STUB](Search.md#stub)
- [authHelper](Search.md#authhelper)
- [base](Search.md#base)
- [dataProto](Search.md#dataproto)
- [defaultPageSize](Search.md#defaultpagesize)
- [inputProto](Search.md#inputproto)
- [metadata](Search.md#metadata)
- [metricDistance](Search.md#metricdistance)
- [pat](Search.md#pat)
- [topK](Search.md#topk)
- [userAppId](Search.md#userappid)

### Methods

- [convertStringToTimestamp](Search.md#convertstringtotimestamp)
- [getAnnotProto](Search.md#getannotproto)
- [getGeoPointProto](Search.md#getgeopointproto)
- [getInputProto](Search.md#getinputproto)
- [grpcRequest](Search.md#grpcrequest)
- [listAllPagesGenerator](Search.md#listallpagesgenerator)
- [listPagesData](Search.md#listpagesdata)
- [listPagesGenerator](Search.md#listpagesgenerator)
- [query](Search.md#query)

## Constructors

### constructor

• **new Search**(`«destructured»`): [`Search`](Search.md)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `authConfig?` | `AuthConfig` | `undefined` |
| › `metric?` | `string` | `DEFAULT_SEARCH_METRIC` |
| › `topK?` | `number` | `DEFAULT_TOP_K` |

#### Returns

[`Search`](Search.md)

#### Overrides

Lister.constructor

#### Defined in

[client/search.ts:48](https://github.com/Clarifai/clarifai-nodejs/blob/2a2dac0/src/client/search.ts#L48)

## Properties

### STUB

• `Protected` **STUB**: `V2Stub`

#### Inherited from

Lister.STUB

#### Defined in

[client/base.ts:26](https://github.com/Clarifai/clarifai-nodejs/blob/2a2dac0/src/client/base.ts#L26)

___

### authHelper

• `Protected` **authHelper**: `ClarifaiAuthHelper`

#### Inherited from

Lister.authHelper

#### Defined in

[client/base.ts:25](https://github.com/Clarifai/clarifai-nodejs/blob/2a2dac0/src/client/base.ts#L25)

___

### base

• `Protected` **base**: `string`

#### Inherited from

Lister.base

#### Defined in

[client/base.ts:30](https://github.com/Clarifai/clarifai-nodejs/blob/2a2dac0/src/client/base.ts#L30)

___

### dataProto

• `Private` **dataProto**: `Data`

#### Defined in

[client/search.ts:45](https://github.com/Clarifai/clarifai-nodejs/blob/2a2dac0/src/client/search.ts#L45)

___

### defaultPageSize

• **defaultPageSize**: `number`

#### Inherited from

Lister.defaultPageSize

#### Defined in

[client/lister.ts:9](https://github.com/Clarifai/clarifai-nodejs/blob/2a2dac0/src/client/lister.ts#L9)

___

### inputProto

• `Private` **inputProto**: `Input`

#### Defined in

[client/search.ts:46](https://github.com/Clarifai/clarifai-nodejs/blob/2a2dac0/src/client/search.ts#L46)

___

### metadata

• `Protected` **metadata**: [`string`, `string`][]

#### Inherited from

Lister.metadata

#### Defined in

[client/base.ts:27](https://github.com/Clarifai/clarifai-nodejs/blob/2a2dac0/src/client/base.ts#L27)

___

### metricDistance

• `Private` **metricDistance**: ``"COSINE_DISTANCE"`` \| ``"EUCLIDEAN_DISTANCE"``

#### Defined in

[client/search.ts:44](https://github.com/Clarifai/clarifai-nodejs/blob/2a2dac0/src/client/search.ts#L44)

___

### pat

• `Protected` **pat**: `string`

#### Inherited from

Lister.pat

#### Defined in

[client/base.ts:28](https://github.com/Clarifai/clarifai-nodejs/blob/2a2dac0/src/client/base.ts#L28)

___

### topK

• `Private` **topK**: `number`

#### Defined in

[client/search.ts:43](https://github.com/Clarifai/clarifai-nodejs/blob/2a2dac0/src/client/search.ts#L43)

___

### userAppId

• `Protected` **userAppId**: `UserAppIDSet`

#### Inherited from

Lister.userAppId

#### Defined in

[client/base.ts:29](https://github.com/Clarifai/clarifai-nodejs/blob/2a2dac0/src/client/base.ts#L29)

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

[client/base.ts:95](https://github.com/Clarifai/clarifai-nodejs/blob/2a2dac0/src/client/base.ts#L95)

___

### getAnnotProto

▸ **getAnnotProto**(`args`): `Annotation`

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | `Object` |
| `args.concepts?` | \{ `id?`: `string` ; `language?`: `string` ; `name?`: `string` ; `value?`: `number`  }[] |
| `args.geoPoint?` | `Object` |
| `args.geoPoint.geoLimit` | `number` |
| `args.geoPoint.latitude` | `number` |
| `args.geoPoint.longitude` | `number` |
| `args.imageBytes?` | `unknown` |
| `args.imageUrl?` | `string` |
| `args.inputDatasetIds?` | `string`[] |
| `args.inputStatusCode?` | `number` |
| `args.inputTypes?` | (``"image"`` \| ``"text"`` \| ``"video"`` \| ``"audio"``)[] |
| `args.metadata?` | `Record`\<`string`, `unknown`\> |
| `args.textRaw?` | `string` |

#### Returns

`Annotation`

#### Defined in

[client/search.ts:74](https://github.com/Clarifai/clarifai-nodejs/blob/2a2dac0/src/client/search.ts#L74)

___

### getGeoPointProto

▸ **getGeoPointProto**(`longitude`, `latitude`, `geoLimit`): `Geo`

#### Parameters

| Name | Type |
| :------ | :------ |
| `longitude` | `number` |
| `latitude` | `number` |
| `geoLimit` | `number` |

#### Returns

`Geo`

#### Defined in

[client/search.ts:182](https://github.com/Clarifai/clarifai-nodejs/blob/2a2dac0/src/client/search.ts#L182)

___

### getInputProto

▸ **getInputProto**(`args`): `Input`

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | `Object` |
| `args.concepts?` | \{ `id?`: `string` ; `language?`: `string` ; `name?`: `string` ; `value?`: `number`  }[] |
| `args.geoPoint?` | `Object` |
| `args.geoPoint.geoLimit` | `number` |
| `args.geoPoint.latitude` | `number` |
| `args.geoPoint.longitude` | `number` |
| `args.imageBytes?` | `unknown` |
| `args.imageUrl?` | `string` |
| `args.inputDatasetIds?` | `string`[] |
| `args.inputStatusCode?` | `number` |
| `args.inputTypes?` | (``"image"`` \| ``"text"`` \| ``"video"`` \| ``"audio"``)[] |
| `args.metadata?` | `Record`\<`string`, `unknown`\> |
| `args.textRaw?` | `string` |

#### Returns

`Input`

#### Defined in

[client/search.ts:146](https://github.com/Clarifai/clarifai-nodejs/blob/2a2dac0/src/client/search.ts#L146)

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

[client/base.ts:72](https://github.com/Clarifai/clarifai-nodejs/blob/2a2dac0/src/client/base.ts#L72)

___

### listAllPagesGenerator

▸ **listAllPagesGenerator**\<`T`\>(`endpoint`, `requestData`): `AsyncGenerator`\<`AsObject` & `Record`\<``"hits"``, `unknown`\>, `void`, `void`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `PostAnnotationsSearchesRequest` \| `PostInputsSearchesRequest` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `endpoint` | (`request`: `T`, `metadata`: `Metadata`, `options`: `Partial`\<`CallOptions`\>) => `Promise`\<`MultiSearchResponse`\> |
| `requestData` | `T` |

#### Returns

`AsyncGenerator`\<`AsObject` & `Record`\<``"hits"``, `unknown`\>, `void`, `void`\>

#### Defined in

[client/search.ts:199](https://github.com/Clarifai/clarifai-nodejs/blob/2a2dac0/src/client/search.ts#L199)

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

[client/lister.ts:86](https://github.com/Clarifai/clarifai-nodejs/blob/2a2dac0/src/client/lister.ts#L86)

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

[client/lister.ts:22](https://github.com/Clarifai/clarifai-nodejs/blob/2a2dac0/src/client/lister.ts#L22)

___

### query

▸ **query**(`«destructured»`): `AsyncGenerator`\<`AsObject` & `Record`\<``"hits"``, `unknown`\>, `void`, `void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `filters?` | \{ `concepts?`: \{ `id?`: `string` ; `language?`: `string` ; `name?`: `string` ; `value?`: `number`  }[] ; `geoPoint?`: \{ `geoLimit`: `number` ; `latitude`: `number` ; `longitude`: `number`  } ; `imageBytes?`: `unknown` ; `imageUrl?`: `string` ; `inputDatasetIds?`: `string`[] ; `inputStatusCode?`: `number` ; `inputTypes?`: (``"image"`` \| ``"text"`` \| ``"video"`` \| ``"audio"``)[] ; `metadata?`: `Record`\<`string`, `unknown`\> ; `textRaw?`: `string`  }[] |
| › `ranks?` | \{ `concepts?`: \{ `id?`: `string` ; `language?`: `string` ; `name?`: `string` ; `value?`: `number`  }[] ; `geoPoint?`: \{ `geoLimit`: `number` ; `latitude`: `number` ; `longitude`: `number`  } ; `imageBytes?`: `unknown` ; `imageUrl?`: `string` ; `inputDatasetIds?`: `string`[] ; `inputStatusCode?`: `number` ; `inputTypes?`: (``"image"`` \| ``"text"`` \| ``"video"`` \| ``"audio"``)[] ; `metadata?`: `Record`\<`string`, `unknown`\> ; `textRaw?`: `string`  }[] |

#### Returns

`AsyncGenerator`\<`AsObject` & `Record`\<``"hits"``, `unknown`\>, `void`, `void`\>

#### Defined in

[client/search.ts:256](https://github.com/Clarifai/clarifai-nodejs/blob/2a2dac0/src/client/search.ts#L256)
