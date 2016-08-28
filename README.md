# Accuser [![Build Status](https://travis-ci.org/mauris/accuser.svg?branch=master)](https://travis-ci.org/mauris/accuser)

Accuser is a lightweight framework that lets you write Github bots that monitor issues and pull requests and work with them.

The framework wraps around the [node-github](https://github.com/mikedeboer/node-github) library to make it easier to monitor pull requests, assign people and write comments.

- [x] Issues and Pull Requests filtering
- [x] Accuse / Assigning PRs
- [x] Commenting
- [x] Labels

## Getting Started

To use Accuser, installed Accuser to your application/project via npm:

    npm install --save accuser

## Future Implementation

- [ ] Webhook / Event Implementation
- [ ] Renaming Title

## Testing

Accuser uses Mocha for unit testing. Ensure that development dependencies are installed and run the following command:

    npm test

## License

Code released under the MIT license.
