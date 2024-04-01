[clarifai-nodejs](../README.md) / [Exports](../modules.md) / Search

# Class: Search

## Hierarchy

- `Lister`

  ↳ **`Search`**

## Table of contents

### Constructors

- [constructor](Search.md#constructor)

### Properties

- [dataProto](Search.md#dataproto)
- [inputProto](Search.md#inputproto)
- [metricDistance](Search.md#metricdistance)
- [topK](Search.md#topk)

### Methods

- [getAnnotProto](Search.md#getannotproto)
- [getGeoPointProto](Search.md#getgeopointproto)
- [getInputProto](Search.md#getinputproto)
- [listAllPagesGenerator](Search.md#listallpagesgenerator)
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

[client/search.ts:51](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/search.ts#L51)

## Properties

### dataProto

• `Private` **dataProto**: `Data`

#### Defined in

[client/search.ts:48](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/search.ts#L48)

___

### inputProto

• `Private` **inputProto**: `Input`

#### Defined in

[client/search.ts:49](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/search.ts#L49)

___

### metricDistance

• `Private` **metricDistance**: ``"COSINE_DISTANCE"`` \| ``"EUCLIDEAN_DISTANCE"``

#### Defined in

[client/search.ts:47](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/search.ts#L47)

___

### topK

• `Private` **topK**: `number`

#### Defined in

[client/search.ts:46](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/search.ts#L46)

## Methods

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

[client/search.ts:77](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/search.ts#L77)

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

[client/search.ts:185](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/search.ts#L185)

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

[client/search.ts:149](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/search.ts#L149)

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

[client/search.ts:202](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/search.ts#L202)

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

[client/search.ts:259](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/search.ts#L259)
