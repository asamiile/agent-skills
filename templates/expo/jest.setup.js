// Storage mock shared by every test; tests that depend on stored values clear it in beforeEach
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
