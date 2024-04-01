[clarifai-nodejs](README.md) / Exports

# clarifai-nodejs

## Table of contents

### Classes

- [App](classes/App.md)
- [Input](classes/Input.md)
- [Model](classes/Model.md)
- [Search](classes/Search.md)
- [User](classes/User.md)
- [Workflow](classes/Workflow.md)

### Type Aliases

- [AppConfig](modules.md#appconfig)
- [CreateDatasetParam](modules.md#createdatasetparam)
- [CreateModelParam](modules.md#createmodelparam)
- [ListAppsRequestParams](modules.md#listappsrequestparams)
- [ListDatasetsParam](modules.md#listdatasetsparam)
- [ListInstalledModuleVersionsParam](modules.md#listinstalledmoduleversionsparam)
- [ListModelsParam](modules.md#listmodelsparam)
- [ListModulesParam](modules.md#listmodulesparam)
- [ListRunnersRequestParams](modules.md#listrunnersrequestparams)
- [ListWorkflowsParam](modules.md#listworkflowsparam)
- [UserConfig](modules.md#userconfig)

## Type Aliases

### AppConfig

Ƭ **AppConfig**: \{ `authConfig`: `Omit`\<`AuthConfig`, ``"appId"`` \| ``"userId"``\> & \{ `appId?`: `undefined` ; `userId?`: `undefined`  } ; `url`: `ClarifaiAppUrl`  } \| \{ `authConfig`: `AuthConfig` ; `url?`: `undefined`  }

#### Defined in

[client/app.ts:52](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/app.ts#L52)

___

### CreateDatasetParam

Ƭ **CreateDatasetParam**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `appId` | `undefined` \| `string` |
| `bookmarkOrigin` | `undefined` \| `AsObject` |
| `createdAt` | `undefined` \| `AsObject` |
| `defaultAnnotationFilter` | `undefined` \| `AsObject` |
| `defaultProcessingInfo` | `undefined` \| `AsObject` |
| `description` | `undefined` \| `string` |
| `image` | `undefined` \| `AsObject` |
| `isStarred` | `undefined` \| `boolean` |
| `metadata` | `undefined` \| `AsObject` |
| `modifiedAt` | `undefined` \| `AsObject` |
| `notes` | `undefined` \| `string` |
| `starCount` | `undefined` \| `number` |
| `userId` | `undefined` \| `string` |
| `version` | `undefined` \| `AsObject` |
| `visibility` | `undefined` \| `AsObject` |

#### Defined in

[client/app.ts:75](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/app.ts#L75)

___

### CreateModelParam

Ƭ **CreateModelParam**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `appId` | `undefined` \| `string` |
| `bookmarkOrigin` | `undefined` \| `AsObject` |
| `checkConsentsList` | `undefined` \| `string`[] |
| `createdAt` | `undefined` \| `AsObject` |
| `defaultEvalInfo` | `undefined` \| `AsObject` |
| `description` | `undefined` \| `string` |
| `displayName` | `undefined` \| `string` |
| `image` | `undefined` \| `AsObject` |
| `isStarred` | `undefined` \| `boolean` |
| `languagesFullList` | `undefined` \| `AsObject`[] |
| `languagesList` | `undefined` \| `string`[] |
| `metadata` | `undefined` \| `AsObject` |
| `modelTypeId` | `undefined` \| `string` |
| `modelVersion` | `undefined` \| `AsObject` |
| `modifiedAt` | `undefined` \| `AsObject` |
| `name` | `undefined` \| `string` |
| `notes` | `undefined` \| `string` |
| `outputInfo` | `undefined` \| `AsObject` |
| `presets` | `undefined` \| `AsObject` |
| `starCount` | `undefined` \| `number` |
| `task` | `undefined` \| `string` |
| `toolkitsList` | `undefined` \| `string`[] |
| `useCasesList` | `undefined` \| `string`[] |
| `userId` | `undefined` \| `string` |
| `visibility` | `undefined` \| `AsObject` |
| `workflowRecommended` | `undefined` \| `AsObject` |

#### Defined in

[client/app.ts:76](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/app.ts#L76)

___

### ListAppsRequestParams

Ƭ **ListAppsRequestParams**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `additionalFieldsList` | `undefined` \| `string`[] |
| `featuredOnly` | `undefined` \| `boolean` |
| `id` | `undefined` \| `string` |
| `name` | `undefined` \| `string` |
| `page` | `undefined` \| `number` |
| `query` | `undefined` \| `string` |
| `search` | `undefined` \| `string` |
| `sortAscending` | `undefined` \| `boolean` |
| `sortByCreatedAt` | `undefined` \| `boolean` |
| `sortByModifiedAt` | `undefined` \| `boolean` |
| `sortByName` | `undefined` \| `boolean` |
| `sortByStarCount` | `undefined` \| `boolean` |
| `starredOnly` | `undefined` \| `boolean` |
| `templateOnly` | `undefined` \| `boolean` |

#### Defined in

[client/user.ts:28](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/user.ts#L28)

___

### ListDatasetsParam

Ƭ **ListDatasetsParam**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `additionalFieldsList` | `undefined` \| `string`[] |
| `bookmark` | `undefined` \| `boolean` |
| `id` | `undefined` \| `string` |
| `page` | `undefined` \| `number` |
| `search` | `undefined` \| `string` |
| `sortAscending` | `undefined` \| `boolean` |
| `sortByCreatedAt` | `undefined` \| `boolean` |
| `sortById` | `undefined` \| `boolean` |
| `sortByModifiedAt` | `undefined` \| `boolean` |
| `sortByStarCount` | `undefined` \| `boolean` |
| `starredOnly` | `undefined` \| `boolean` |

#### Defined in

[client/app.ts:65](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/app.ts#L65)

___

### ListInstalledModuleVersionsParam

Ƭ **ListInstalledModuleVersionsParam**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `page` | `undefined` \| `number` |

#### Defined in

[client/app.ts:73](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/app.ts#L73)

___

### ListModelsParam

Ƭ **ListModelsParam**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `additionalFieldsList` | `undefined` \| `string`[] |
| `bookmark` | `undefined` \| `boolean` |
| `dontFetchFromMain` | `undefined` \| `boolean` |
| `featuredOnly` | `undefined` \| `boolean` |
| `filterByUserId` | `undefined` \| `boolean` |
| `inputFieldsList` | `undefined` \| `string`[] |
| `languagesList` | `undefined` \| `string`[] |
| `license` | `undefined` \| `string` |
| `modelTypeId` | `undefined` \| `string` |
| `name` | `undefined` \| `string` |
| `outputFieldsList` | `undefined` \| `string`[] |
| `page` | `undefined` \| `number` |
| `query` | `undefined` \| `string` |
| `search` | `undefined` \| `string` |
| `sortAscending` | `undefined` \| `boolean` |
| `sortByCreatedAt` | `undefined` \| `boolean` |
| `sortByModifiedAt` | `undefined` \| `boolean` |
| `sortByName` | `undefined` \| `boolean` |
| `sortByNumInputs` | `undefined` \| `boolean` |
| `sortByStarCount` | `undefined` \| `boolean` |
| `starredOnly` | `undefined` \| `boolean` |
| `toolkitsList` | `undefined` \| `string`[] |
| `trainedOnly` | `undefined` \| `boolean` |
| `useCasesList` | `undefined` \| `string`[] |

#### Defined in

[client/app.ts:67](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/app.ts#L67)

___

### ListModulesParam

Ƭ **ListModulesParam**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `additionalFieldsList` | `undefined` \| `string`[] |
| `bookmark` | `undefined` \| `boolean` |
| `filterByUserId` | `undefined` \| `boolean` |
| `name` | `undefined` \| `string` |
| `page` | `undefined` \| `number` |
| `search` | `undefined` \| `string` |
| `sortAscending` | `undefined` \| `boolean` |
| `sortByCreatedAt` | `undefined` \| `boolean` |
| `sortById` | `undefined` \| `boolean` |
| `sortByModifiedAt` | `undefined` \| `boolean` |
| `sortByStarCount` | `undefined` \| `boolean` |
| `starredOnly` | `undefined` \| `boolean` |

#### Defined in

[client/app.ts:71](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/app.ts#L71)

___

### ListRunnersRequestParams

Ƭ **ListRunnersRequestParams**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `page` | `undefined` \| `number` |

#### Defined in

[client/user.ts:30](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/user.ts#L30)

___

### ListWorkflowsParam

Ƭ **ListWorkflowsParam**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `additionalFieldsList` | `undefined` \| `string`[] |
| `bookmark` | `undefined` \| `boolean` |
| `featuredOnly` | `undefined` \| `boolean` |
| `id` | `undefined` \| `string` |
| `page` | `undefined` \| `number` |
| `query` | `undefined` \| `string` |
| `search` | `undefined` \| `string` |
| `searchTerm` | `undefined` \| `string` |
| `sortAscending` | `undefined` \| `boolean` |
| `sortByCreatedAt` | `undefined` \| `boolean` |
| `sortById` | `undefined` \| `boolean` |
| `sortByModifiedAt` | `undefined` \| `boolean` |
| `sortByStarCount` | `undefined` \| `boolean` |
| `starredOnly` | `undefined` \| `boolean` |

#### Defined in

[client/app.ts:69](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/app.ts#L69)

___

### UserConfig

Ƭ **UserConfig**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `appId` | `string` |
| `base` | `undefined` \| `string` |
| `pat` | `string` |
| `token` | `undefined` \| `string` |
| `ui` | `undefined` \| `string` |
| `userId` | `string` |

#### Defined in

[client/user.ts:27](https://github.com/Clarifai/clarifai-nodejs/blob/4511094/src/client/user.ts#L27)
