[clarifai-nodejs](../README.md) / [Exports](../modules.md) / Search

# Class: Search

## Hierarchy

- `Lister`

  ↳ **`Search`**

## Table of contents

### Constructors

- [constructor](Search.md#constructor)

### Properties

- [algorithm](Search.md#algorithm)
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
| › `algorithm?` | `SupportedAlgorithm` | `DEFAULT_SEARCH_ALGORITHM` |
| › `authConfig?` | `AuthConfig` | `undefined` |
| › `metric?` | `SupportedMetric` | `DEFAULT_SEARCH_METRIC` |
| › `topK?` | `number` | `DEFAULT_TOP_K` |

#### Returns

[`Search`](Search.md)

#### Overrides

Lister.constructor

#### Defined in

[src/client/search.ts:59](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/search.ts#L59)

## Properties

### algorithm

• `Private` **algorithm**: `SupportedAlgorithm`

#### Defined in

[src/client/search.ts:57](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/search.ts#L57)

___

### dataProto

• `Private` **dataProto**: `Data`

#### Defined in

[src/client/search.ts:55](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/search.ts#L55)

___

### inputProto

• `Private` **inputProto**: `Input`

#### Defined in

[src/client/search.ts:56](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/search.ts#L56)

___

### metricDistance

• `Private` **metricDistance**: ``"COSINE_DISTANCE"`` \| ``"EUCLIDEAN_DISTANCE"``

#### Defined in

[src/client/search.ts:54](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/search.ts#L54)

___

### topK

• `Private` **topK**: `number`

#### Defined in

[src/client/search.ts:53](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/search.ts#L53)

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

[src/client/search.ts:94](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/search.ts#L94)

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

[src/client/search.ts:204](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/search.ts#L204)

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

[src/client/search.ts:168](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/search.ts#L168)

___

### listAllPagesGenerator

▸ **listAllPagesGenerator**\<`T`\>(`«destructured»`): `AsyncGenerator`\<`AsObject`, `void`, `void`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `PostAnnotationsSearchesRequest` \| `PostInputsSearchesRequest` |

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `endpoint` | (`request`: `T`, `metadata`: `Metadata`, `options`: `Partial`\<`CallOptions`\>) => `Promise`\<`MultiSearchResponse`\> | `undefined` |
| › `page?` | `number` | `1` |
| › `perPage?` | `number` | `undefined` |
| › `requestData` | `T` | `undefined` |

#### Returns

`AsyncGenerator`\<`AsObject`, `void`, `void`\>

#### Defined in

[src/client/search.ts:221](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/search.ts#L221)

___

### query

▸ **query**(`«destructured»`): `AsyncGenerator`\<`AsObject`, `void`, `void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `filters?` | \{ `concepts?`: \{ `id?`: `string` ; `language?`: `string` ; `name?`: `string` ; `value?`: `number`  }[] ; `geoPoint?`: \{ `geoLimit`: `number` ; `latitude`: `number` ; `longitude`: `number`  } ; `imageBytes?`: `unknown` ; `imageUrl?`: `string` ; `inputDatasetIds?`: `string`[] ; `inputStatusCode?`: `number` ; `inputTypes?`: (``"image"`` \| ``"text"`` \| ``"video"`` \| ``"audio"``)[] ; `metadata?`: `Record`\<`string`, `unknown`\> ; `textRaw?`: `string`  }[] |
| › `page?` | `number` |
| › `perPage?` | `number` |
| › `ranks?` | \{ `concepts?`: \{ `id?`: `string` ; `language?`: `string` ; `name?`: `string` ; `value?`: `number`  }[] ; `geoPoint?`: \{ `geoLimit`: `number` ; `latitude`: `number` ; `longitude`: `number`  } ; `imageBytes?`: `unknown` ; `imageUrl?`: `string` ; `inputDatasetIds?`: `string`[] ; `inputStatusCode?`: `number` ; `inputTypes?`: (``"image"`` \| ``"text"`` \| ``"video"`` \| ``"audio"``)[] ; `metadata?`: `Record`\<`string`, `unknown`\> ; `textRaw?`: `string`  }[] |

#### Returns

`AsyncGenerator`\<`AsObject`, `void`, `void`\>

#### Defined in

[src/client/search.ts:287](https://github.com/Clarifai/clarifai-nodejs/blob/caa21f4/src/client/search.ts#L287)
