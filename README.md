# Notifications Management API

[![License](https://img.shields.io/github/license/US-EPA-CAMD/easey-notifications-api)](https://github.com/US-EPA-CAMD/easey-notifications-api/blob/develop/LICENSE)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=US-EPA-CAMD_easey-notifications-api&metric=alert_status)](https://sonarcloud.io/dashboard?id=US-EPA-CAMD_easey-notifications-api)
[![Develop CI/CD](https://github.com/US-EPA-CAMD/easey-notifications-api/workflows/Develop%20Branch%20Workflow/badge.svg)](https://github.com/US-EPA-CAMD/easey-notifications-api/actions)
[![Release CI/CD](https://github.com/US-EPA-CAMD/easey-notifications-api/workflows/Release%20Branch%20Workflow/badge.svg)](https://github.com/US-EPA-CAMD/easey-notifications-api/actions)
![Issues](https://img.shields.io/github/issues/US-EPA-CAMD/easey-notifications-api)
![Forks](https://img.shields.io/github/forks/US-EPA-CAMD/easey-notifications-api)
![Stars](https://img.shields.io/github/stars/US-EPA-CAMD/easey-notifications-api)
[![Open in Visual Studio Code](https://open.vscode.dev/badges/open-in-vscode.svg)](https://open.vscode.dev/US-EPA-CAMD/easey-notifications-api)

## Description
Manages user & system wide notifications such as emails and alerts. The ECMPS and CAMPD Contact Us form uses the email notification to send emails to the Help & Support queues.

## Getting Started
Follow these [instructions](https://github.com/US-EPA-CAMD/devops/blob/master/GETTING-STARTED.md) to get the project up and running correctly.

## Installing
1. Open a terminal and navigate to the directory where you wish to store the repository.
2. Clone the repository using one of the following git cli commands or using your favorit Git management software<br>
    **Using SSH**
    ```
    $ git clone git@github.com:US-EPA-CAMD/easey-notifications-api.git
    ```
    **Using HTTPS**
    ```
    $ git clone https://github.com/US-EPA-CAMD/easey-notifications-api.git
    ```
3. Navigate to the projects root directory
    ```
    $ cd easey-emissions-api
    ```
4. Install package dependencies
    ```
    $ yarn install
    ```

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
Please refer to the Notifications Management API Swagger Documentation for descriptions of the endpoints.<br>
[Dev Environment](https://api.epa.gov/easey/dev/notifications-mgmt/swagger/) | [Test Environment](https://api.epa.gov/easey/test/notifications-mgmt/swagger/) | [Beta Environment](https://api.epa.gov/easey/beta/notifications-mgmt/swagger/) | [Staging Environment](https://api.epa.gov/easey/staging/notifications-mgmt/swagger/)

## License & Contributing
This project is licensed under the MIT License. We encourage you to read this project’s [License](LICENSE), [Contributing Guidelines](CONTRIBUTING.md), and [Code of Conduct](CODE-OF-CONDUCT.md).

## Disclaimer
The United States Environmental Protection Agency (EPA) GitHub project code is provided on an "as is" basis and the user assumes responsibility for its use. EPA has relinquished control of the information and no longer has responsibility to protect the integrity , confidentiality, or availability of the information. Any reference to specific commercial products, processes, or services by service mark, trademark, manufacturer, or otherwise, does not constitute or imply their endorsement, recommendation or favoring by EPA. The EPA seal and logo shall not be used in any manner to imply endorsement of any commercial product or activity by EPA or the United States Government.