import React from 'react';
import { View } from 'react-native';

const HayaSelectModule = {
  PI: Math.PI,
  hello: () => 'Hello from JS!',
  setValueAsync: async () => {},
  addListener: () => {},
  removeListeners: () => {},
};

export const HayaSelectView = ({ style }: { style?: object }) => <View style={style} />;

export default HayaSelectModule;
