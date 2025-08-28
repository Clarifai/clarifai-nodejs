[clarifai-nodejs](../README.md) / [Exports](../modules.md) / RAG

# Class: RAG

## Table of contents

### Constructors

- [constructor](RAG.md#constructor)

### Properties

- [app](RAG.md#app)
- [authConfig](RAG.md#authconfig)
- [promptWorkflow](RAG.md#promptworkflow)

### Methods

- [chat](RAG.md#chat)
- [upload](RAG.md#upload)
- [validateInputs](RAG.md#validateinputs)
- [setup](RAG.md#setup)

## Constructors

### constructor

• **new RAG**(`«destructured»`): [`RAG`](RAG.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `RAGConfig` |

#### Returns

[`RAG`](RAG.md)

#### Defined in

[src/client/rag.ts:67](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/rag.ts#L67)

## Properties

### app

• **app**: [`App`](App.md)

#### Defined in

[src/client/rag.ts:65](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/rag.ts#L65)

___

### authConfig

• `Private` **authConfig**: `AuthConfig`

#### Defined in

[src/client/rag.ts:61](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/rag.ts#L61)

___

### promptWorkflow

• **promptWorkflow**: [`Workflow`](Workflow.md)

#### Defined in

[src/client/rag.ts:63](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/rag.ts#L63)

## Methods

### chat

▸ **chat**(`«destructured»`): `Promise`\<`Message`[]\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `clientManageState?` | `boolean` | `true` |
| › `messages` | `Message`[] | `undefined` |

#### Returns

`Promise`\<`Message`[]\>

#### Defined in

[src/client/rag.ts:405](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/rag.ts#L405)

___

### upload

▸ **upload**(`«destructured»`): `Promise`\<`void`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `batchSize?` | `number` | `128` |
| › `chunkOverlap?` | `number` | `200` |
| › `chunkSize?` | `number` | `1024` |
| › `datasetId?` | `string` | `undefined` |
| › `filePath?` | `string` | `undefined` |
| › `folderPath?` | `string` | `undefined` |
| › `metadata?` | `Record`\<`string`, `JavaScriptValue`\> | `undefined` |
| › `url?` | `string` | `undefined` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/client/rag.ts:283](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/rag.ts#L283)

___

### validateInputs

▸ **validateInputs**(`workflowUrl?`, `workflow?`, `authConfig?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `workflowUrl?` | `string` |
| `workflow?` | [`Workflow`](Workflow.md) |
| `authConfig?` | `AuthConfig` \| `UrlAuthConfig` |

#### Returns

`void`

#### Defined in

[src/client/rag.ts:89](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/rag.ts#L89)

___

### setup

▸ **setup**(`«destructured»`): `Promise`\<[`RAG`](RAG.md)\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `appUrl?` | \`$\{string}://$\{string}/$\{string}/$\{string}\` | `undefined` |
| › `authConfig?` | [`AuthAppConfig`](../modules.md#authappconfig) \| `Omit`\<`AuthConfig`, ``"appId"``\> & \{ `appId?`: `undefined`  } | `undefined` |
| › `baseWorkflow?` | `string` | `"Text"` |
| › `llmUrl?` | `ClarifaiUrl` | `"https://clarifai.com/mistralai/completion/models/mistral-7B-Instruct"` |
| › `maxResults?` | `number` | `5` |
| › `minScore?` | `number` | `0.95` |
| › `promptTemplate?` | `string` | `DEFAULT_RAG_PROMPT_TEMPLATE` |
| › `workflowId?` | `string` | `undefined` |
| › `workflowYamlFilename?` | `string` | `"prompter_wf.yaml"` |

#### Returns

`Promise`\<[`RAG`](RAG.md)\>

#### Defined in

[src/client/rag.ts:109](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/rag.ts#L109)
