[clarifai-nodejs](../README.md) / [Exports](../modules.md) / Workflow

# Class: Workflow

## Hierarchy

- `Lister`

  ↳ **`Workflow`**

## Table of contents

### Constructors

- [constructor](Workflow.md#constructor)

### Properties

- [appId](Workflow.md#appid)
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

[src/client/workflow.ts:55](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/workflow.ts#L55)

## Properties

### appId

• **appId**: `string`

#### Defined in

[src/client/workflow.ts:52](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/workflow.ts#L52)

___

### id

• **id**: `string`

#### Defined in

[src/client/workflow.ts:51](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/workflow.ts#L51)

___

### outputConfig

• `Private` **outputConfig**: `OutputConfig`

#### Defined in

[src/client/workflow.ts:53](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/workflow.ts#L53)

___

### versionId

• `Private` **versionId**: `string`

#### Defined in

[src/client/workflow.ts:50](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/workflow.ts#L50)

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

[src/client/workflow.ts:267](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/workflow.ts#L267)

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

[src/client/workflow.ts:221](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/workflow.ts#L221)

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

[src/client/workflow.ts:84](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/workflow.ts#L84)

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

[src/client/workflow.ts:160](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/workflow.ts#L160)

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

[src/client/workflow.ts:199](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/workflow.ts#L199)
