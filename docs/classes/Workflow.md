[clarifai-nodejs](../README.md) / [Exports](../modules.md) / Workflow

# Class: Workflow

## Hierarchy

- `Lister`

  ↳ **`Workflow`**

## Table of contents

### Constructors

- [constructor](Workflow.md#constructor)

### Properties

- [STUB](Workflow.md#stub)
- [authHelper](Workflow.md#authhelper)
- [base](Workflow.md#base)
- [defaultPageSize](Workflow.md#defaultpagesize)
- [id](Workflow.md#id)
- [metadata](Workflow.md#metadata)
- [outputConfig](Workflow.md#outputconfig)
- [pat](Workflow.md#pat)
- [userAppId](Workflow.md#userappid)
- [versionId](Workflow.md#versionid)

### Methods

- [convertStringToTimestamp](Workflow.md#convertstringtotimestamp)
- [exportWorkflow](Workflow.md#exportworkflow)
- [grpcRequest](Workflow.md#grpcrequest)
- [listPagesData](Workflow.md#listpagesdata)
- [listPagesGenerator](Workflow.md#listpagesgenerator)
- [listVersions](Workflow.md#listversions)
- [predict](Workflow.md#predict)
- [predictByBytes](Workflow.md#predictbybytes)
- [predictByUrl](Workflow.md#predictbyurl)

## Constructors

### constructor

• **new Workflow**(`«destructured»`): [`Workflow`](Workflow.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `WorkflowConfig` |

#### Returns

[`Workflow`](Workflow.md)

#### Overrides

Lister.constructor

#### Defined in

[client/workflow.ts:50](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/workflow.ts#L50)

## Properties

### STUB

• `Protected` **STUB**: `V2Stub`

#### Inherited from

Lister.STUB

#### Defined in

[client/base.ts:26](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/base.ts#L26)

___

### authHelper

• `Protected` **authHelper**: `ClarifaiAuthHelper`

#### Inherited from

Lister.authHelper

#### Defined in

[client/base.ts:25](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/base.ts#L25)

___

### base

• `Protected` **base**: `string`

#### Inherited from

Lister.base

#### Defined in

[client/base.ts:30](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/base.ts#L30)

___

### defaultPageSize

• **defaultPageSize**: `number`

#### Inherited from

Lister.defaultPageSize

#### Defined in

[client/lister.ts:9](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/lister.ts#L9)

___

### id

• `Private` **id**: `string`

#### Defined in

[client/workflow.ts:47](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/workflow.ts#L47)

___

### metadata

• `Protected` **metadata**: [`string`, `string`][]

#### Inherited from

Lister.metadata

#### Defined in

[client/base.ts:27](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/base.ts#L27)

___

### outputConfig

• `Private` **outputConfig**: `OutputConfig`

#### Defined in

[client/workflow.ts:48](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/workflow.ts#L48)

___

### pat

• `Protected` **pat**: `string`

#### Inherited from

Lister.pat

#### Defined in

[client/base.ts:28](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/base.ts#L28)

___

### userAppId

• `Protected` **userAppId**: `UserAppIDSet`

#### Inherited from

Lister.userAppId

#### Defined in

[client/base.ts:29](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/base.ts#L29)

___

### versionId

• `Private` **versionId**: `string`

#### Defined in

[client/workflow.ts:46](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/workflow.ts#L46)

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

[client/base.ts:95](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/base.ts#L95)

___

### exportWorkflow

▸ **exportWorkflow**(`outPath`): `Promise`\<`void`\>

Exports the workflow to a yaml file.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `outPath` | `string` | The path to save the yaml file to. |

#### Returns

`Promise`\<`void`\>

**`Example`**

```typescript
import { Workflow } from "./workflow";

const workflow = new Workflow("https://clarifai.com/clarifai/main/workflows/Demographics");
await workflow.export("out_path.yml");
```

#### Defined in

[client/workflow.ts:253](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/workflow.ts#L253)

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

[client/base.ts:72](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/base.ts#L72)

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

[client/lister.ts:86](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/lister.ts#L86)

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

[client/lister.ts:22](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/lister.ts#L22)

___

### listVersions

▸ **listVersions**(`«destructured»`): `AsyncGenerator`\<`AsObject`, `void`, `void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `pageNo?` | `number` |
| › `perPage?` | `number` |

#### Returns

`AsyncGenerator`\<`AsObject`, `void`, `void`\>

#### Defined in

[client/workflow.ts:211](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/workflow.ts#L211)

___

### predict

▸ **predict**(`«destructured»`): `Promise`\<`AsObject`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `inputs` | `Input`[] |
| › `workflowStateId?` | `string` |

#### Returns

`Promise`\<`AsObject`\>

#### Defined in

[client/workflow.ts:79](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/workflow.ts#L79)

___

### predictByBytes

▸ **predictByBytes**(`inputBytes`, `inputType`): `Promise`\<`AsObject`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `inputBytes` | `Buffer` |
| `inputType` | ``"image"`` \| ``"text"`` \| ``"video"`` \| ``"audio"`` |

#### Returns

`Promise`\<`AsObject`\>

#### Defined in

[client/workflow.ts:150](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/workflow.ts#L150)

___

### predictByUrl

▸ **predictByUrl**(`url`, `inputType`): `Promise`\<`AsObject`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `url` | `string` |
| `inputType` | ``"image"`` \| ``"text"`` \| ``"video"`` \| ``"audio"`` |

#### Returns

`Promise`\<`AsObject`\>

#### Defined in

[client/workflow.ts:189](https://github.com/Clarifai/clarifai-nodejs/blob/f6de468/src/client/workflow.ts#L189)
