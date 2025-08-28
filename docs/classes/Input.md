[clarifai-nodejs](../README.md) / [Exports](../modules.md) / Input

# Class: Input

Inputs is a class that provides access to Clarifai API endpoints related to Input information.

## Hierarchy

- `Lister`

  ↳ **`Input`**

## Table of contents

### Constructors

- [constructor](Input.md#constructor)

### Properties

- [numOfWorkers](Input.md#numofworkers)

### Methods

- [bulkUpload](Input.md#bulkupload)
- [deleteFailedInputs](Input.md#deletefailedinputs)
- [patchInputs](Input.md#patchinputs)
- [retryUploads](Input.md#retryuploads)
- [uploadAnnotations](Input.md#uploadannotations)
- [uploadBatch](Input.md#uploadbatch)
- [uploadFromBytes](Input.md#uploadfrombytes)
- [uploadFromFile](Input.md#uploadfromfile)
- [uploadFromUrl](Input.md#uploadfromurl)
- [uploadInputs](Input.md#uploadinputs)
- [uploadText](Input.md#uploadtext)
- [waitForInputs](Input.md#waitforinputs)
- [getBboxProto](Input.md#getbboxproto)
- [getImageInputsFromFolder](Input.md#getimageinputsfromfolder)
- [getInputFromBytes](Input.md#getinputfrombytes)
- [getInputFromFile](Input.md#getinputfromfile)
- [getInputFromUrl](Input.md#getinputfromurl)
- [getInputsFromCsv](Input.md#getinputsfromcsv)
- [getMaskProto](Input.md#getmaskproto)
- [getMultimodalInput](Input.md#getmultimodalinput)
- [getProto](Input.md#getproto)
- [getTextInput](Input.md#gettextinput)
- [getTextInputsFromFolder](Input.md#gettextinputsfromfolder)

## Constructors

### constructor

• **new Input**(`params`): [`Input`](Input.md)

Initializes an input object.

### Example
```ts
import { Input } from "clarifai-nodejs";

export const input = new Input({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
});
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `params` | `Object` | The parameters for the Input object. |
| `params.authConfig?` | `AuthConfig` | - |

#### Returns

[`Input`](Input.md)

#### Overrides

Lister.constructor

#### Defined in

[src/client/input.ts:101](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/input.ts#L101)

## Properties

### numOfWorkers

• `Private` **numOfWorkers**: `number`

#### Defined in

[src/client/input.ts:87](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/input.ts#L87)

## Methods

### bulkUpload

▸ **bulkUpload**(`«destructured»`): `Promise`\<`void`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `batchSize?` | `number` | `128` |
| › `inputs` | `Input`[] | `undefined` |
| › `uploadProgressEmitter?` | [`InputBulkUpload`](../modules.md#inputbulkupload) | `undefined` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/client/input.ts:1038](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/input.ts#L1038)

___

### deleteFailedInputs

▸ **deleteFailedInputs**(`«destructured»`): `Promise`\<`Input`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `inputs` | `Input`[] |

#### Returns

`Promise`\<`Input`[]\>

#### Defined in

[src/client/input.ts:1165](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/input.ts#L1165)

___

### patchInputs

▸ **patchInputs**(`«destructured»`): `Promise`\<`string`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `action?` | `string` | `"merge"` |
| › `inputs` | `Input`[] | `undefined` |

#### Returns

`Promise`\<`string`\>

#### Defined in

[src/client/input.ts:970](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/input.ts#L970)

___

### retryUploads

▸ **retryUploads**(`«destructured»`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `failedInputs` | `Input`[] |

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/client/input.ts:1209](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/input.ts#L1209)

___

### uploadAnnotations

▸ **uploadAnnotations**(`«destructured»`): `Promise`\<`Annotation`[]\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `batchAnnot` | `Annotation`[] | `undefined` |
| › `showLog?` | `boolean` | `true` |

#### Returns

`Promise`\<`Annotation`[]\>

#### Defined in

[src/client/input.ts:1006](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/input.ts#L1006)

___

### uploadBatch

▸ **uploadBatch**(`«destructured»`): `Promise`\<`Input`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `inputs` | `Input`[] |

#### Returns

`Promise`\<`Input`[]\>

#### Defined in

[src/client/input.ts:1090](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/input.ts#L1090)

___

### uploadFromBytes

▸ **uploadFromBytes**(`«destructured»`): `Promise`\<`string`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `audioBytes?` | ``null`` \| `Uint8Array` | `null` |
| › `datasetId?` | ``null`` \| `string` | `null` |
| › `geoInfo?` | ``null`` \| `AsObject` | `null` |
| › `imageBytes?` | ``null`` \| `Uint8Array` | `null` |
| › `inputId` | `string` | `undefined` |
| › `labels?` | ``null`` \| `string`[] | `null` |
| › `metadata?` | ``null`` \| `Record`\<`string`, `JavaScriptValue`\> | `null` |
| › `textBytes?` | ``null`` \| `Uint8Array` | `null` |
| › `videoBytes?` | ``null`` \| `Uint8Array` | `null` |

#### Returns

`Promise`\<`string`\>

#### Defined in

[src/client/input.ts:918](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/input.ts#L918)

___

### uploadFromFile

▸ **uploadFromFile**(`«destructured»`): `Promise`\<`string`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `audioFile?` | ``null`` \| `string` | `null` |
| › `datasetId?` | ``null`` \| `string` | `null` |
| › `geoInfo?` | ``null`` \| `AsObject` | `null` |
| › `imageFile?` | ``null`` \| `string` | `null` |
| › `inputId` | `string` | `undefined` |
| › `labels?` | ``null`` \| `string`[] | `null` |
| › `metadata?` | ``null`` \| `Record`\<`string`, `JavaScriptValue`\> | `null` |
| › `textFile?` | ``null`` \| `string` | `null` |
| › `videoFile?` | ``null`` \| `string` | `null` |

#### Returns

`Promise`\<`string`\>

#### Defined in

[src/client/input.ts:883](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/input.ts#L883)

___

### uploadFromUrl

▸ **uploadFromUrl**(`«destructured»`): `Promise`\<`string`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `audioUrl?` | ``null`` \| `string` | `null` |
| › `datasetId?` | ``null`` \| `string` | `null` |
| › `geoInfo?` | ``null`` \| `AsObject` | `null` |
| › `imageUrl?` | ``null`` \| `string` | `null` |
| › `inputId` | `string` | `undefined` |
| › `labels?` | ``null`` \| `string`[] | `null` |
| › `metadata?` | ``null`` \| `Record`\<`string`, `JavaScriptValue`\> | `null` |
| › `textUrl?` | ``null`` \| `string` | `null` |
| › `videoUrl?` | ``null`` \| `string` | `null` |

#### Returns

`Promise`\<`string`\>

#### Defined in

[src/client/input.ts:848](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/input.ts#L848)

___

### uploadInputs

▸ **uploadInputs**(`«destructured»`): `Promise`\<`string`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `inputs` | `Input`[] | `undefined` |
| › `showLog?` | `boolean` | `true` |

#### Returns

`Promise`\<`string`\>

#### Defined in

[src/client/input.ts:804](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/input.ts#L804)

___

### uploadText

▸ **uploadText**(`«destructured»`): `Promise`\<`string`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `datasetId?` | ``null`` \| `string` | `null` |
| › `inputId` | `string` | `undefined` |
| › `rawText` | `string` | `undefined` |

#### Returns

`Promise`\<`string`\>

#### Defined in

[src/client/input.ts:953](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/input.ts#L953)

___

### waitForInputs

▸ **waitForInputs**(`«destructured»`): `Promise`\<`boolean`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `inputJobId` | `string` |

#### Returns

`Promise`\<`boolean`\>

#### Defined in

[src/client/input.ts:1101](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/input.ts#L1101)

___

### getBboxProto

▸ **getBboxProto**(`«destructured»`): `Annotation`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `bbox` | `number`[] |
| › `inputId` | `string` |
| › `label` | `string` |

#### Returns

`Annotation`

#### Defined in

[src/client/input.ts:719](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/input.ts#L719)

___

### getImageInputsFromFolder

▸ **getImageInputsFromFolder**(`«destructured»`): `Input`[]

Upload image inputs from folder.

### Example
```ts
import { Input, Model } from "clarifai-nodejs";
import path from "path";

// Generate a new GRPC compatible Input object from buffer
const imageInputs = Input.getImageInputsFromFolder({
  // Ensure the directory contains a list of images
  folderPath: path.resolve(__dirname, "path/to/imageFolder"),
});

// The input can now be used as an input for a model prediction methods
const model = new Model({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
  modelId: "multimodal-clip-embed",
});
const prediction = await model.predict({
  inputs: imageInputs,
});
console.log(prediction);
```

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `datasetId?` | ``null`` \| `string` | `null` |
| › `folderPath` | `string` | `undefined` |
| › `labels?` | `boolean` | `false` |

#### Returns

`Input`[]

#### Defined in

[src/client/input.ts:433](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/input.ts#L433)

___

### getInputFromBytes

▸ **getInputFromBytes**(`«destructured»`): `Input`

Creates an input proto from bytes.

### Example
```ts
import { Input, Model } from "clarifai-nodejs";
import * as fs from "fs";

const imageBuffer = fs.readFileSync("path/to/image.jpg");

// Generate a new GRPC compatible Input object from buffer
const imageInput = Input.getInputFromBytes({
  inputId: "demo",
  imageBytes: imageBuffer,
});

// The input can now be used as an input for a model prediction methods
const model = new Model({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
  modelId: "multimodal-clip-embed",
});
const prediction = await model.predict({
  inputs: [imageInput],
});
console.log(prediction);
```

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `audioBytes?` | ``null`` \| `Uint8Array` | `null` |
| › `datasetId?` | ``null`` \| `string` | `null` |
| › `geoInfo?` | ``null`` \| `AsObject` | `null` |
| › `imageBytes?` | ``null`` \| `Uint8Array` | `null` |
| › `inputId` | `string` | `undefined` |
| › `labels?` | ``null`` \| `string`[] | `null` |
| › `metadata?` | ``null`` \| `Record`\<`string`, `JavaScriptValue`\> | `null` |
| › `textBytes?` | ``null`` \| `Uint8Array` | `null` |
| › `videoBytes?` | ``null`` \| `Uint8Array` | `null` |

#### Returns

`Input`

An `Input` object for the specified input ID.

#### Defined in

[src/client/input.ts:231](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/input.ts#L231)

___

### getInputFromFile

▸ **getInputFromFile**(`«destructured»`): `Input`

Create input proto from files.

### Example
```ts
import { Input, Model } from "clarifai-nodejs";
import path from "path";

// Generate a new GRPC compatible Input object from buffer
const imageInput = Input.getInputFromFile({
  inputId: "demo",
  imageFile: path.resolve(__dirname, "path/to/image.jpg"),
});

// The input can now be used as an input for a model prediction methods
const model = new Model({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
  modelId: "multimodal-clip-embed",
});
const prediction = await model.predict({
  inputs: [imageInput],
});
console.log(prediction);
```

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `audioFile?` | ``null`` \| `string` | `null` |
| › `datasetId?` | ``null`` \| `string` | `null` |
| › `geoInfo?` | ``null`` \| `AsObject` | `null` |
| › `imageFile?` | ``null`` \| `string` | `null` |
| › `inputId` | `string` | `undefined` |
| › `labels?` | ``null`` \| `string`[] | `null` |
| › `metadata?` | ``null`` \| `Record`\<`string`, `JavaScriptValue`\> | `null` |
| › `textFile?` | ``null`` \| `string` | `null` |
| › `videoFile?` | ``null`` \| `string` | `null` |

#### Returns

`Input`

- An Input object for the specified input ID.

#### Defined in

[src/client/input.ts:295](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/input.ts#L295)

___

### getInputFromUrl

▸ **getInputFromUrl**(`«destructured»`): `Input`

Upload input from URL.

### Example
```ts
import { Input, Model } from "clarifai-nodejs";

// Generate a new GRPC compatible Input object from buffer
const imageInput = Input.getInputFromUrl({
  inputId: "demo",
  imageUrl: "https://samples.clarifai.com/dog2.jpeg",
});

// The input can now be used as an input for a model prediction methods
const model = new Model({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
  modelId: "multimodal-clip-embed",
});
const prediction = await model.predict({
  inputs: [imageInput],
});
console.log(prediction);
```

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `audioUrl?` | ``null`` \| `string` | `null` |
| › `datasetId?` | ``null`` \| `string` | `null` |
| › `geoInfo?` | ``null`` \| `AsObject` | `null` |
| › `imageUrl?` | ``null`` \| `string` | `null` |
| › `inputId` | `string` | `undefined` |
| › `labels?` | ``null`` \| `string`[] | `null` |
| › `metadata?` | ``null`` \| `Record`\<`string`, `JavaScriptValue`\> | `null` |
| › `textUrl?` | ``null`` \| `string` | `null` |
| › `videoUrl?` | ``null`` \| `string` | `null` |

#### Returns

`Input`

- Job ID for the upload request.

#### Defined in

[src/client/input.ts:359](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/input.ts#L359)

___

### getInputsFromCsv

▸ **getInputsFromCsv**(`«destructured»`): `Promise`\<`Input`[]\>

Create Input proto from CSV File. Supported columns are:
'inputid', 'input', 'concepts', 'metadata', 'geopoints'

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `csvPath` | `string` | `undefined` |
| › `csvType` | ``"url"`` \| ``"raw"`` \| ``"file"`` | `"raw"` |
| › `datasetId?` | ``null`` \| `string` | `null` |
| › `inputType` | ``"image"`` \| ``"text"`` \| ``"video"`` \| ``"audio"`` | `"text"` |
| › `labels` | `boolean` | `true` |

#### Returns

`Promise`\<`Input`[]\>

- An array of Input objects for the specified input ID.

#### Defined in

[src/client/input.ts:573](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/input.ts#L573)

___

### getMaskProto

▸ **getMaskProto**(`«destructured»`): `Annotation`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `inputId` | `string` |
| › `label` | `string` |
| › `polygons` | `Polygon`[] |

#### Returns

`Annotation`

#### Defined in

[src/client/input.ts:760](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/input.ts#L760)

___

### getMultimodalInput

▸ **getMultimodalInput**(`«destructured»`): `Input`

Create input proto for text and image from bytes or url

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `datasetId?` | ``null`` \| `string` | `null` |
| › `imageBytes?` | ``null`` \| `Uint8Array` | `null` |
| › `imageUrl?` | ``null`` \| `string` | `null` |
| › `inputId` | `string` | `undefined` |
| › `labels?` | ``null`` \| `string`[] | `null` |
| › `rawText?` | ``null`` \| `string` | `null` |
| › `textBytes?` | ``null`` \| `Uint8Array` | `null` |

#### Returns

`Input`

- An Input object for the specified input ID.

#### Defined in

[src/client/input.ts:513](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/input.ts#L513)

___

### getProto

▸ **getProto**(`«destructured»`): `Input`

Create input proto for image data type.

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `audioPb?` | ``null`` \| \{ `base64`: `string`  } | `null` |
| › `datasetId?` | ``null`` \| `string` | `null` |
| › `geoInfo?` | ``null`` \| `AsObject` | `null` |
| › `imagePb?` | ``null`` \| \{ `base64`: `string` ; `url?`: `undefined`  } \| \{ `base64?`: `undefined` ; `url`: `string`  } | `null` |
| › `inputId` | `string` | `undefined` |
| › `labels?` | ``null`` \| `string`[] | `null` |
| › `metadata?` | ``null`` \| `Record`\<`string`, `JavaScriptValue`\> | `null` |
| › `textPb?` | ``null`` \| \{ `raw`: `string`  } | `null` |
| › `videoPb?` | ``null`` \| \{ `base64`: `string`  } | `null` |

#### Returns

`Input`

- An Input object for the specified input ID.

#### Defined in

[src/client/input.ts:119](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/input.ts#L119)

___

### getTextInput

▸ **getTextInput**(`«destructured»`): `Input`

Create input proto for text data type from raw text.

### Example
```ts
import { Input, Model } from "clarifai-nodejs";

// Generate a new GRPC compatible Input object from buffer
const textInput = Input.getTextInput({
  inputId: "demo",
  rawText: "Sample text for input generation",
});

// The input can now be used as an input for a model prediction methods
const model = new Model({
  authConfig: {
    pat: process.env.CLARIFAI_PAT!,
    userId: process.env.CLARIFAI_USER_ID!,
    appId: process.env.CLARIFAI_APP_ID!,
  },
  modelId: "multimodal-clip-embed",
});
const prediction = await model.predict({
  inputs: [textInput],
});
console.log(prediction);
```

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `datasetId?` | ``null`` \| `string` | `null` |
| › `geoInfo?` | ``null`` \| `AsObject` | `null` |
| › `inputId` | `string` | `undefined` |
| › `labels?` | ``null`` \| `string`[] | `null` |
| › `metadata?` | ``null`` \| `Record`\<`string`, `JavaScriptValue`\> | `null` |
| › `rawText` | `string` | `undefined` |

#### Returns

`Input`

- An Input object for the specified input ID.

#### Defined in

[src/client/input.ts:476](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/input.ts#L476)

___

### getTextInputsFromFolder

▸ **getTextInputsFromFolder**(`«destructured»`): `Input`[]

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `datasetId` | ``null`` \| `string` | `null` |
| › `folderPath` | `string` | `undefined` |
| › `labels` | `boolean` | `false` |

#### Returns

`Input`[]

#### Defined in

[src/client/input.ts:688](https://github.com/Clarifai/clarifai-nodejs/blob/435d969/src/client/input.ts#L688)
