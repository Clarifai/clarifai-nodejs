# Clarifai Node.js Contributing Guide

This project welcomes contributions from the community! Whether you're fixing bugs, adding new features, or improving documentation, your help is appreciated. Please follow the guidelines below to ensure a smooth contribution process.

## How to Contribute

1. **Fork the Repository**: Start by forking the Clarifai Node.js repository to your own GitHub account.

2. **Clone Your Fork**: Clone your forked repository to your local machine using:
```bash
  git clone
```

3. **Create a Branch**: Create a new branch for your feature or bug fix:
```bash
git checkout -b my-feature-branch
```

4. Running the project:
- The project recommends using fnm to manage Node.js versions.
- The required node version is specified in the `.nvmrc` file.
- Once the dependencies are installed, you need to setup the following environment variables for running tests: (read about getting the Pat [here](https://docs.clarifai.com/control/authentication/pat/))
```bash
VITE_CLARIFAI_USER_ID=
VITE_CLARIFAI_PAT=
```

5. This project uses Vitest for testing. To run the tests, use the following command:
```bash
npm run test
```

6. The project uses GRPC to connect with the Clarifai API. The GRPC packages are installed from [Clarifai Node.js GRPC](https://github.com/clarifai/clarifai-nodejs-grpc)

7. Each commit should have a clear and descriptive message. Follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification for commit messages.

8. You can generate automated Docs using TypeDoc. To generate the documentation, run:
```bash
npm run generate-docs
```

## Project Structure

The project is organized as follows:
- `src/`: Contains the source code for the Clarifai Node.js SDK.
- The primary modules are under top level of `src/client/` directory

For example, for working with the models API, you can find the relevant code in `src/client/model.ts`.

## Release Process

This project uses Release Please to automate the release process. To create a new release, follow these steps:
- Ensure all your changes are committed and pushed to your branch.
- Create a pull request to merge your changes into the main branch.
- Add the following commit message to the pull request to trigger a release:
```bash
# Release-As: <semantic-version>
Release-As: 0.2.1
```
For example:
- The PR: https://github.com/Clarifai/clarifai-nodejs/pull/38
- Is merged with message: https://github.com/Clarifai/clarifai-nodejs/commit/7b7de7b28d47bb3e54cd97c533bf0947a394ef9c

This will trigger a Release PR: https://github.com/Clarifai/clarifai-nodejs/pull/39

When the Release PR is merged, it'll trigger a new release with the specified version.
