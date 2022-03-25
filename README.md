# Web3 Analytics Proof of Concept

This project demonstrates how [Analytics](https://github.com/davidwells/analytics), a lighweight analytics abstration layer, can be used with a custom back-end to send web3 tracking data to [Ceramic](https://ceramic.network/), a decentralized data network.

[See demo](https://celadon-pothos-120129.netlify.app/)

The key component is analytics-plugin-ceramic.js, which creates and authenticates a DID if one doesn't exist, and saves tracking events to Ceramic. The user controls all the data and can delete it whenever they like. No one else can delete or modify the data. analytics-plugin-ceramic.js will be migrated out to a standalone project and perhaps made available via npm.

This example actually uses two back-ends in parallel, demonstrating how data could be sent to both Ceramic and Google Analytics simultaneously. The goal is not to send web3 data to Google Analytics, but rather show how it's possible to temporarily use their nice dashboards and tooling while standing up a decentralized web3 analytics solution without worrying about migration of data or switching challenges. 

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.
