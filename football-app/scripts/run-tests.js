#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const Module = require('module');

const defaultCompilerOptions = {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2019,
  esModuleInterop: true,
  jsx: ts.JsxEmit.React,
  allowJs: true,
  resolveJsonModule: true,
  isolatedModules: true,
};

const registerExtension = (ext) => {
  require.extensions[ext] = (module, filename) => {
    const source = fs.readFileSync(filename, 'utf8');
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: defaultCompilerOptions,
      fileName: filename,
    });

    module._compile(outputText, filename);
  };
};

registerExtension('.ts');
registerExtension('.tsx');

const originalModuleLoad = Module._load;
Module._load = function patchedModuleLoad(request, parent, isMain) {
  if (request === 'react-native') {
    const React = require('react');
    return {
      StyleSheet: { create: (styles) => styles },
      Text: (props) => React.createElement('Text', props, props.children),
      View: (props) => React.createElement('View', props, props.children),
      TouchableOpacity: (props) => React.createElement('TouchableOpacity', props, props.children),
    };
  }

  return originalModuleLoad(request, parent, isMain);
};

const projectRoot = path.resolve(__dirname, '..');

function readSource(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
}

(function verifyCreditPackages() {
  const source = readSource('src/config/purchases.ts');
  assert(source.includes('export const CREDIT_PACKAGES'), 'CREDIT_PACKAGES export is missing');

  const packageIds = ['credits_starter', 'credits_pro', 'credits_ultimate'];
  for (const id of packageIds) {
    const idIndex = source.indexOf(`id: '${id}'`);
    assert(idIndex !== -1, `Expected credit package with id "${id}" to be defined`);

    const segment = source.slice(idIndex, source.indexOf('},', idIndex) + 1);
    assert(
      segment.includes('priceLabel'),
      `Credit package "${id}" should include a priceLabel field`,
    );
  }

  assert(
    source.includes('bestValue: true'),
    'One package should be flagged as the best value option',
  );
})();

(function verifyPaymentService() {
  const source = readSource('src/services/payments.ts');
  assert(source.includes('export const getCreditPackages = async'), 'Missing getCreditPackages helper');
  assert(source.includes('export const purchaseCreditPackage = async'), 'Missing purchaseCreditPackage helper');
  assert(source.includes('export const restorePurchaseHistory = async'), 'Missing restorePurchaseHistory helper');
  assert(source.includes('await wait(400);'), 'purchaseCreditPackage should simulate processing time');
  assert(source.includes('creditsAwarded: selectedPackage.credits'), 'purchaseCreditPackage should award credits from the selected package');
})();

(function verifyProfileScreen() {
  const source = readSource('src/screens/ProfileScreen.tsx');
  assert(source.includes('purchaseCreditPackage'), 'Profile screen should trigger credit purchases');
  assert(source.includes('restorePurchaseHistory'), 'Profile screen should support restoring purchases');
  assert(source.includes('ActivityIndicator'), 'Profile screen should render a loading indicator');
  assert(
    source.includes('Buy more credits'),
    'Profile screen should present a purchase section to the user',
  );
})();

(function verifyKitAndChatIntegration() {
  const kitBoard = readSource('src/components/KitDesignBoard.tsx');
  assert(
    kitBoard.includes('linkThreadMetadata'),
    'Kit design board should sync kit projects with the associated chat thread metadata',
  );
  assert(
    kitBoard.includes('metadata: { relatedKitProjectId: project.id }'),
    'Kit design board should link the active project to the contextual chat thread',
  );

  const teamChat = readSource('src/components/TeamChatPanel.tsx');
  assert(
    teamChat.includes('metadata: { relatedKitProjectId: kitProjects[0].id }'),
    'Team chat panel should seed kit threads with the initial project metadata',
  );
  assert(
    teamChat.includes('metadata: { relatedKitProjectId: activeKitProjectId }'),
    'Team chat panel should keep the kit thread metadata in sync with the latest project',
  );
})();

(function runTeamCardFormattingUnitTests() {
  const { runTeamCardFormattingTests } = require('../src/tests/teamCardFormatting.test.tsx');
  runTeamCardFormattingTests();
})();

(function runTeamScreenDataUnitTests() {
  const { runTeamScreenDataTests } = require('../src/tests/teamScreenData.test');
  runTeamScreenDataTests();
})();

console.log('All assertions passed.');
