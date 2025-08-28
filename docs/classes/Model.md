[clarifai-nodejs](../README.md) / [Exports](../modules.md) / Model

# Class: Model

Model is a class that provides access to Clarifai API endpoints related to Model information.

## Hierarchy

- `Lister`

  ↳ **`Model`**

## Table of contents

### Constructors

- [constructor](Model.md#constructor)

### Properties

- [appId](Model.md#appid)
- [id](Model.md#id)
- [modelInfo](Model.md#modelinfo)
- [modelUserAppId](Model.md#modeluserappid)
- [modelVersion](Model.md#modelversion)
- [runner](Model.md#runner)
- [trainingParams](Model.md#trainingparams)

### Methods

- [availableMethods](Model.md#availablemethods)
- [constructRequestWithMethodSignature](Model.md#constructrequestwithmethodsignature)
- [createVersion](Model.md#createversion)
- [deleteVersion](Model.md#deleteversion)
- [generate](Model.md#generate)
- [generateGrpc](Model.md#generategrpc)
- [getParamInfo](Model.md#getparaminfo)
- [getParams](Model.md#getparams)
- [getRunner](Model.md#getrunner)
- [listTrainingTemplates](Model.md#listtrainingtemplates)
- [listVersions](Model.md#listversions)
- [loadInfo](Model.md#loadinfo)
- [methodSignatures](Model.md#methodsignatures)
- [overrideModelVersion](Model.md#overridemodelversion)
- [predict](Model.md#predict)
- [predictByBytes](Model.md#predictbybytes)
- [predictByFilepath](Model.md#predictbyfilepath)
- [predictByUrl](Model.md#predictbyurl)
- [setRunner](Model.md#setrunner)
- [stream](Model.md#stream)
- [streamWithControl](Model.md#streamwithcontrol)
- [updateParams](Model.md#updateparams)
- [getOutputDataFromModelResponse](Model.md#getoutputdatafrommodelresponse)

## Constructors

### constructor

• **new Model**(`config`): [`Model`](Model.md)

Initializes a Model object.

### Example
```ts
import { Model } from "clarifai-nodejs";

export const model = new Model({
  modelId: "face-detection",
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | `ModelConfig` |

#### Returns

[`Model`](Model.md)

#### Overrides

Lister.constructor

#### Defined in

[src/client/model.ts:132](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L132)

## Properties

### appId

• `Private` **appId**: `string`

#### Defined in

[src/client/model.ts:111](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L111)

___

### id

• `Private` **id**: `string`

#### Defined in

[src/client/model.ts:112](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L112)

___

### modelInfo

• **modelInfo**: `Model`

#### Defined in

[src/client/model.ts:115](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L115)

___

### modelUserAppId

• `Private` **modelUserAppId**: `undefined` \| `UserAppIDSet`

#### Defined in

[src/client/model.ts:113](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L113)

___

### modelVersion

• `Private` **modelVersion**: `undefined` \| \{ `id`: `string`  }

#### Defined in

[src/client/model.ts:114](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L114)

___

### runner

• `Private` **runner**: `undefined` \| `RunnerSelector`

#### Defined in

[src/client/model.ts:117](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L117)

___

### trainingParams

• `Private` **trainingParams**: `Record`\<`string`, `unknown`\>

#### Defined in

[src/client/model.ts:116](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L116)

## Methods

### availableMethods

▸ **availableMethods**(): `Promise`\<`string`[]\>

#### Returns

`Promise`\<`string`[]\>

#### Defined in

[src/client/model.ts:647](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L647)

___

### constructRequestWithMethodSignature

▸ **constructRequestWithMethodSignature**(`request`, `config`): `Promise`\<`PostModelOutputsRequest`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | `PostModelOutputsRequest` |
| `config` | `TextModelPredictConfig` |

#### Returns

`Promise`\<`PostModelOutputsRequest`\>

#### Defined in

[src/client/model.ts:663](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L663)

___

### createVersion

▸ **createVersion**(`modelVersion`): `Promise`\<`undefined` \| `AsObject`\>

Creates a model version for the Model.

### Example
```ts
import { Model } from "clarifai-nodejs";
import {
  ModelVersion,
  OutputInfo,
} from "clarifai-nodejs-grpc/proto/clarifai/api/resources_pb";
import { Struct } from "google-protobuf/google/protobuf/struct_pb.js";

export const model = new Model({
  modelId: "margin-100-image-cropper",
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

// Creating a GRPC compatible outputInfo object with custom margin parameters
const outputInfo = new OutputInfo().setParams(
  Struct.fromJavaScript({ margin: 1.5 }),
);
// GRPC compatible ModelVersion object with previously created output info config
const modelVersion = new ModelVersion()
  .setDescription("Setting output info margin parameters to 1.5")
  .setOutputInfo(outputInfo);

// Creating a new version of the model with previously created output info config
const modelObjectWithVersion = await model.createVersion(modelVersion);

console.log(modelObjectWithVersion);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `modelVersion` | `ModelVersion` |

#### Returns

`Promise`\<`undefined` \| `AsObject`\>

#### Defined in

[src/client/model.ts:545](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L545)

___

### deleteVersion

▸ **deleteVersion**(`versionId`): `Promise`\<`void`\>

Deletes a model version for the Model.

### Example
```ts
import { Model } from "clarifai-nodejs";

export const model = new Model({
  modelId: "face-detection",
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

model.deleteVersion("version_id");
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `versionId` | `string` | The version ID to delete. |

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/client/model.ts:514](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L514)

___

### generate

▸ **generate**(`«destructured»`): `AsyncGenerator`\<`AsObject`[], `any`, `unknown`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `TextModelPredictConfig` |

#### Returns

`AsyncGenerator`\<`AsObject`[], `any`, `unknown`\>

#### Defined in

[src/client/model.ts:1120](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L1120)

___

### generateGrpc

▸ **generateGrpc**(`«destructured»`): `AsyncGenerator`\<`AsObject` \| [``"deploying"``, `AsObject`], `any`, `unknown`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `TextModelPredictConfig` |

#### Returns

`AsyncGenerator`\<`AsObject` \| [``"deploying"``, `AsObject`], `any`, `unknown`\>

#### Defined in

[src/client/model.ts:848](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L848)

___

### getParamInfo

▸ **getParamInfo**(`param`): `Promise`\<`Record`\<`string`, `any`\>\>

Returns the param info for the model.

### Example
```ts
import { Model } from "clarifai-nodejs";

export const model = new Model({
  modelId: "face-detection",
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

model.getParamInfo("template");
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `param` | `string` |

#### Returns

`Promise`\<`Record`\<`string`, `any`\>\>

#### Defined in

[src/client/model.ts:446](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L446)

___

### getParams

▸ **getParams**(`template?`, `saveTo?`): `Promise`\<`Record`\<`string`, `any`\>\>

Returns the model params for the model type as object & also writes to a yaml file

### Example
```ts
import { Model } from "clarifai-nodejs";

export const model = new Model({
  modelId: "face-detection",
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

const modelParams = await model.getParams("face-detection", "params.yml");
console.log(modelParams);
```

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `template` | ``null`` \| `string` | `null` | The training template to use for the model type. |
| `saveTo` | `string` | `"params.yaml"` | The file path to save the yaml file. |

#### Returns

`Promise`\<`Record`\<`string`, `any`\>\>

- A promise that resolves to the model params for the model type.

#### Defined in

[src/client/model.ts:336](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L336)

___

### getRunner

▸ **getRunner**(): `undefined` \| `AsObject`

Returns the runner for the model.

#### Returns

`undefined` \| `AsObject`

- The runner for the model.

#### Defined in

[src/client/model.ts:230](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L230)

___

### listTrainingTemplates

▸ **listTrainingTemplates**(): `Promise`\<`string`[]\>

Lists all the training templates for the model type.

### Example
```ts
import { Model } from "clarifai-nodejs";

export const model = new Model({
  modelId: "face-detection",
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

const trainingTemplates = await model.listTrainingTemplates();
console.log(trainingTemplates);
```

#### Returns

`Promise`\<`string`[]\>

- A promise that resolves to a list of training templates for the model type.

#### Defined in

[src/client/model.ts:289](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L289)

___

### listVersions

▸ **listVersions**(`«destructured»?`): `AsyncGenerator`\<`AsObject`[], `void`, `void`\>

Lists all the versions for the model.

### Example
```ts
import { Model } from "clarifai-nodejs";

export const model = new Model({
  modelId: "lvm-dummy-test",
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

const versions = await model.listVersions().next();

console.log(versions);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `pageNo?` | `number` |
| › `perPage?` | `number` |

#### Returns

`AsyncGenerator`\<`AsObject`[], `void`, `void`\>

**`Remarks`**

Defaults to 16 per page if pageNo is not specified

#### Defined in

[src/client/model.ts:589](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L589)

___

### loadInfo

▸ **loadInfo**(): `Promise`\<`void`\>

Loads the current model info.
Usually called internally by other methods, to ensure the model info is loaded with latest data.

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/client/model.ts:238](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L238)

___

### methodSignatures

▸ **methodSignatures**(): `Promise`\<`AsObject`[]\>

#### Returns

`Promise`\<`AsObject`[]\>

#### Defined in

[src/client/model.ts:625](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L625)

___

### overrideModelVersion

▸ **overrideModelVersion**(`«destructured»`): `void`

Overrides the model version.

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `inferenceParams?` | `Record`\<`string`, `JavaScriptValue`\> |
| › `outputConfig?` | `OutputConfig` |

#### Returns

`void`

#### Defined in

[src/client/model.ts:1314](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L1314)

___

### predict

▸ **predict**(`predictArgs`): `Promise`\<`AsObject`[]\>

Predicts the model based on the given inputs.
Useful for chat / text based llms

#### Parameters

| Name | Type |
| :------ | :------ |
| `predictArgs` | `TextModelPredictConfig` |

#### Returns

`Promise`\<`AsObject`[]\>

#### Defined in

[src/client/model.ts:740](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L740)

▸ **predict**(`«destructured»`): `Promise`\<`AsObject`[]\>

Predicts the model based on the given inputs.
Use the `Input` module to create the input objects.

### Example
```ts
import { Model, Input } from "clarifai-nodejs";

export const model = new Model({
  modelId: "multimodal-clip-embed",
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

const input = Input.getInputFromBytes({
  inputId: "intro-text",
  textBytes: Buffer.from("Hi my name is Jim."),
});

const textPrediction = await model.predict({
  inputs: [input],
});

console.log(textPrediction);

const imageInput = Input.getInputFromUrl({
  inputId: "test-image",
  imageUrl:
    "https://goldenglobes.com/wp-content/uploads/2023/10/17-tomcruiseag.jpg",
});

const imagePrediction = await model.predict({
  inputs: [imageInput],
});

console.log(imagePrediction);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `GeneralModelPredictConfig` |

#### Returns

`Promise`\<`AsObject`[]\>

- A promise that resolves to the model prediction.

#### Defined in

[src/client/model.ts:758](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L758)

___

### predictByBytes

▸ **predictByBytes**(`«destructured»`): `Promise`\<`AsObject`[]\>

Predicts the model based on the given inputs.
Inputs can be provided as a Buffer.

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `inferenceParams?` | `Record`\<`string`, `JavaScriptValue`\> |
| › `inputBytes` | `Buffer` |
| › `inputType` | ``"image"`` \| ``"text"`` \| ``"video"`` \| ``"audio"`` |
| › `outputConfig?` | `OutputConfig` |

#### Returns

`Promise`\<`AsObject`[]\>

- A promise that resolves to the model prediction.

#### Defined in

[src/client/model.ts:1255](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L1255)

___

### predictByFilepath

▸ **predictByFilepath**(`«destructured»`): `Promise`\<`AsObject`[]\>

Predicts the model based on the given inputs.
Inputs can be provided as a filepath which can be read.

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `filepath` | `string` |
| › `inferenceParams?` | `Record`\<`string`, `JavaScriptValue`\> |
| › `inputType` | ``"image"`` \| ``"text"`` \| ``"video"`` \| ``"audio"`` |
| › `outputConfig?` | `OutputConfig` |

#### Returns

`Promise`\<`AsObject`[]\>

- A promise that resolves to the model prediction.

#### Defined in

[src/client/model.ts:1221](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L1221)

___

### predictByUrl

▸ **predictByUrl**(`«destructured»`): `Promise`\<`AsObject`[]\>

Predicts the model based on the given inputs.
Inputs can be provided as a URL.

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `inferenceParams?` | `Record`\<`string`, `JavaScriptValue`\> |
| › `inputType` | ``"image"`` \| ``"text"`` \| ``"video"`` \| ``"audio"`` |
| › `outputConfig?` | `OutputConfig` |
| › `url` | `string` |

#### Returns

`Promise`\<`AsObject`[]\>

- A promise that resolves to the model prediction.

#### Defined in

[src/client/model.ts:1179](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L1179)

___

### setRunner

▸ **setRunner**(`runner`): `void`

Sets the runner for the model.

#### Parameters

| Name | Type |
| :------ | :------ |
| `runner` | `Subset`\<`AsObject`\> |

#### Returns

`void`

#### Defined in

[src/client/model.ts:202](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L202)

___

### stream

▸ **stream**(`config`): `Promise`\<\{ `end`: () => `void` ; `iterator`: `AsyncGenerator`\<`AsObject`[], `any`, `unknown`\> ; `send`: (`request`: `PostModelOutputsRequest`) => `void`  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | `TextModelPredictConfig` |

#### Returns

`Promise`\<\{ `end`: () => `void` ; `iterator`: `AsyncGenerator`\<`AsObject`[], `any`, `unknown`\> ; `send`: (`request`: `PostModelOutputsRequest`) => `void`  }\>

#### Defined in

[src/client/model.ts:1034](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L1034)

___

### streamWithControl

▸ **streamWithControl**(`«destructured»`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `TextModelPredictConfig` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `end` | () => `void` |
| `iterator` | `AsyncGenerator`\<`AsObject` \| [``"deploying"``, `AsObject`], `any`, `unknown`\> |
| `send` | (`request`: `PostModelOutputsRequest`) => `void` |

#### Defined in

[src/client/model.ts:931](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L931)

___

### updateParams

▸ **updateParams**(`modelParams`): `void`

Updates the model params for the model.

### Example
```ts
import { Model } from "clarifai-nodejs";

export const model = new Model({
  modelId: "face-detection",
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});

model.updateParams({
  batchSize: 8,
  datasetVersion: "version_id",
});
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `modelParams` | `Record`\<`string`, `unknown`\> | The model params to update. |

#### Returns

`void`

#### Defined in

[src/client/model.ts:415](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L415)

___

### getOutputDataFromModelResponse

▸ **getOutputDataFromModelResponse**(`outputs`): `undefined` \| `AsObject`

#### Parameters

| Name | Type |
| :------ | :------ |
| `outputs` | `AsObject`[] |

#### Returns

`undefined` \| `AsObject`

#### Defined in

[src/client/model.ts:641](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/model.ts#L641)
