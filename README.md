# CAMD Administrative & General Services

[![License](https://img.shields.io/github/license/US-EPA-CAMD/easey-camd-services)](https://github.com/US-EPA-CAMD/easey-camd-services/blob/develop/LICENSE)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=US-EPA-CAMD_easey-camd-services&metric=alert_status)](https://sonarcloud.io/dashboard?id=US-EPA-CAMD_easey-camd-services)
[![Develop CI/CD](https://github.com/US-EPA-CAMD/easey-camd-services/workflows/Develop%20Branch%20Workflow/badge.svg)](https://github.com/US-EPA-CAMD/easey-camd-services/actions)
[![Release CI/CD](https://github.com/US-EPA-CAMD/easey-camd-services/workflows/Release%20Branch%20Workflow/badge.svg)](https://github.com/US-EPA-CAMD/easey-camd-services/actions)
![Issues](https://img.shields.io/github/issues/US-EPA-CAMD/easey-camd-services)
![Forks](https://img.shields.io/github/forks/US-EPA-CAMD/easey-camd-services)
![Stars](https://img.shields.io/github/stars/US-EPA-CAMD/easey-camd-services)
[![Open in Visual Studio Code](https://open.vscode.dev/badges/open-in-vscode.svg)](https://open.vscode.dev/US-EPA-CAMD/easey-camd-services)

## Description
NestJS REST API for administrative & general services supporting the EPA Clean Air Markets Division (CAMD) ECMPS & CAMPD applications

## Getting Started
Follow these [instructions](https://github.com/US-EPA-CAMD/devops/blob/master/GETTING-STARTED.md) to get the project up and running correctly.

## Installing
1. Open a terminal and navigate to the directory where you wish to store the repository.
2. Clone the repository using one of the following git cli commands or using your favorit Git management software<br>
    **Using SSH**
    ```
    $ git clone git@github.com:US-EPA-CAMD/easey-camd-services.git
    ```
    **Using HTTPS**
    ```
    $ git clone https://github.com/US-EPA-CAMD/easey-camd-services.git
    ```
3. Navigate to the projects root directory
    ```
    $ cd easey-camd-services
    ```
4. Install package dependencies
    ```
    $ yarn install
    ```

## Configuration
The CAMD Services uses a number of environment variables to properly configure the api. The following is the list of configureble values and their default setting.

### APP VARIABLES
| Typescript Var Name | Environment Var Name | Default Value | Comment |
| :------------------ | :------------------- | :------------ | :------ |
| name | N/A | camd-services | Fixed value |
| host | EASEY_CAMD_SERVICES_HOST | localhost | Configurable
| port | EASEY_CAMD_SERVICES_PORT | 8060 | Configurable |
| path | EASEY_CAMD_SERVICES_PATH | camd-services | Configurable |
| title | EASEY_CAMD_SERVICES_TITLE | CAMD Administrative & General Services | Configurable |
| description | EASEY_CAMD_SERVICES_DESCRIPTION | ??? | Configurable |
| env | EASEY_CAMD_SERVICES_ENV | local-dev | Configurable |
| apiKey | EASEY_CAMD_SERVICES_API_KEY | *** | Dynamically set by CI/CD workflow |
| enableApiKey | EASEY_CAMD_SERVICES_ENABLE_API_KEY | false | Configurable |
| enableClientToken | EASEY_CAMD_SERVICES_ENABLE_CLIENT_TOKEN | false | Configurable |
| secretToken | EASEY_CAMD_SERVICES_SECRET_TOKEN | *** | Dynamically set by CI/CD workflow |
| enableSecretToken | EASEY_CAMD_SERVICES_ENABLE_SECRET_TOKEN | false | Configurable |
| enableCors | EASEY_CAMD_SERVICES_ENABLE_CORS | true | Configurable |
| enableGlobalValidationPipes | EASEY_CAMD_SERVICES_ENABLE_GLOBAL_VALIDATION_PIPE | true | Configurable |
| version | EASEY_CAMD_SERVICES_VERSION | v0.0.0 | Dynamically set by CI/CD workflow |
| published | EASEY_CAMD_SERVICES_PUBLISHED | local | Dynamically set by CI/CD workflow |
| smtpHost | EASEY_CAMD_SERVICES_SMTP_HOST | smtp.epa.gov | Configurable |
| smtpPort | EASEY_CAMD_SERVICES_SMTP_PORT | 25 | Configurable |
| enableDebug | EASEY_CAMD_SERVICES_ENABLE_DEBUG | false | Configurable |
| apiHost | EASEY_API_GATEWAY_HOST | api.epa.gov/easey/dev | Configurable |
| authApi.uri | EASEY_AUTH_API | https://api.epa.gov/easey/dev/auth-mgmt | Configurable |

### CDX BYPASS VARIABLES
| Typescript Var Name | Environment Var Name | Default Value | Comment |
| :------------------ | :------------------- | :------------ | :------ |
| bucket | EASEY_BULK_FILES_AWS_BUCKET | None | Configurable |
| region | EASEY_BULK_FILES_AWS_REGION | us-gov-west-1 | Configurable |
| accessKeyId | EASEY_BULK_FILES_AWS_ACCESS_KEY_ID | *** | Dynamically set by CI/CD workflow |
| secretAccessKey | EASEY_BULK_FILES_AWS_SECRET_ACCESS_KEY | *** | Dynamically set by CI/CD workflow |

## Environment Variables File
Database credentials are injected into the cloud.gov environments as part of the CI/CD deployment process therefore they do not need to be configured. However, when running locally for local development the following environment variables are required to be configured using a local .env file in the root of the project. **PLEASE DO NOT commit the .env file to source control.**

- EASEY_CAMD_SERVICES_ENABLE_DEBUG=true|false
- EASEY_CAMD_SERVICES_ENABLE_API_KEY=true|false
  - IF ABOVE IS TRUE THEN SET
    - EASEY_CAMD_SERVICES_API_KEY={ask project dev/tech lead}
- EASEY_CAMD_SERVICES_ENABLE_SECRET_TOKEN=true|false
  - IF ABOVE IS TRUE THEN SET
    - EASEY_CAMD_SERVICES_SECRET_TOKEN={ask project dev/tech lead}

**Please refer to our [Getting Started](https://github.com/US-EPA-CAMD/devops/blob/master/GETTING-STARTED.md) instructions on how to configure the following environment variables & connect to the database.**
- EASEY_DB_HOST
- EASEY_DB_PORT
- EASEY_DB_NAME
- EASEY_DB_USER
- EASEY_DB_PWD

## Building, Testing, & Running the application
From within the projects root directory run the following commands using the yarn command line interface

**Run in development mode**
```
$ yarn start:dev
```

**Install/update package dependencies & run in development mode**
```
$ yarn up
```

**Unit tests**
```
$ yarn test
```

**Build**
```
$ yarn build
```

**Run in production mode**
```
$ yarn start
```

## API Endpoints
Please refer to the EASEY CAMD Services Swagger Documentation for descriptions of the endpoints.<br>
[Dev Environment](https://api.epa.gov/easey/dev/camd-services/swagger/) | [Test Environment](https://api.epa.gov/easey/test/camd-services/swagger/) | [Beta Environment](https://api.epa.gov/easey/beta/camd-services/swagger/) | [Staging Environment](https://api.epa.gov/easey/staging/camd-services/swagger/)

## License & Contributing
This project is licensed under the MIT License. We encourage you to read this project’s [License](LICENSE), [Contributing Guidelines](CONTRIBUTING.md), and [Code of Conduct](CODE-OF-CONDUCT.md).

## Disclaimer
The United States Environmental Protection Agency (EPA) GitHub project code is provided on an "as is" basis and the user assumes responsibility for its use. EPA has relinquished control of the information and no longer has responsibility to protect the integrity , confidentiality, or availability of the information. Any reference to specific commercial products, processes, or services by service mark, trademark, manufacturer, or otherwise, does not constitute or imply their endorsement, recommendation or favoring by EPA. The EPA seal and logo shall not be used in any manner to imply endorsement of any commercial product or activity by EPA or the United States Government.