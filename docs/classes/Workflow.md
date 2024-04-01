[clarifai-nodejs](../README.md) / [Exports](../modules.md) / Workflow

# Class: Workflow

## Hierarchy

- `Lister`

  ↳ **`Workflow`**

## Table of contents

### Constructors

- [constructor](Workflow.md#constructor)

### Properties

- [id](Workflow.md#id)
- [outputConfig](Workflow.md#outputconfig)
- [versionId](Workflow.md#versionid)

### Methods

- [exportWorkflow](Workflow.md#exportworkflow)
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

[client/workflow.ts:53](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/workflow.ts#L53)

## Properties

### id

• `Private` **id**: `string`

#### Defined in

[client/workflow.ts:50](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/workflow.ts#L50)

___

### outputConfig

• `Private` **outputConfig**: `OutputConfig`

#### Defined in

[client/workflow.ts:51](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/workflow.ts#L51)

___

### versionId

• `Private` **versionId**: `string`

#### Defined in

[client/workflow.ts:49](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/workflow.ts#L49)

## Methods

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

[client/workflow.ts:256](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/workflow.ts#L256)

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

[client/workflow.ts:214](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/workflow.ts#L214)

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

[client/workflow.ts:82](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/workflow.ts#L82)

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

[client/workflow.ts:153](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/workflow.ts#L153)

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

[client/workflow.ts:192](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/workflow.ts#L192)
