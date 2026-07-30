// jest.config.js — configuração do Jest
// // ficheiros de test

module.exports = {
  preset: "ts-jest", // usa o ts-jest para entender ficheiros TypeScript
  testEnvironment: "node", // simula um ambiente Node.js (não browser)
  testMatch: ["**/*.test.ts"], // só considera ficheiros terminados em .test.ts
  verbose: true, // mostra o nome de cada teste individual no terminal
};