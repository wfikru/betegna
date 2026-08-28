import { registerRootComponent } from 'expo';

import App from './src/App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App)
// on native and sets up the web root (index.html) for react-native-web.
registerRootComponent(App);
