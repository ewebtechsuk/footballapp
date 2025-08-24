const React = require('react');

const View = ({ children, ...props }) => React.createElement('div', props, children);
const Text = ({ children, ...props }) => React.createElement('span', props, children);
const TextInput = ({ value, onChangeText, ...props }) => React.createElement('input', {
  ...props,
  value,
  onChange: (e) => onChangeText && onChangeText(e.target.value),
});
const Button = ({ title, onPress, ...props }) => React.createElement('button', { onClick: onPress, onPress: onPress, ...props }, title);
const StyleSheet = {
  create: (s) => s,
  flatten: (s) => {
    if (!s) return s;
    if (Array.isArray(s)) return Object.assign({}, ...s.map((i) => (i ? (typeof i === 'object' ? i : {}) : {})));
    return typeof s === 'object' ? s : {};
  },
};
const Alert = { alert: () => null };
const Platform = { OS: 'android' };

module.exports = {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Platform,
};
