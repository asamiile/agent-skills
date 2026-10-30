// Component test for a screen that does not depend on device latency. The connection hook is mocked,
// so no socket is opened; the test checks what the user sees and which functions their taps call.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { SettingsScreen } from "./SettingsScreen";

const connect = jest.fn();
jest.mock("../hooks/useConnection", () => ({
  useConnection: () => ({ status: "offline", connect, disconnect: jest.fn() }),
}));

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear(); // stored values otherwise leak between tests
});

it("connects to the address the user typed", async () => {
  // Testing Library v13+: render and fireEvent are async; without await, queries run on an unfinished tree
  await render(<SettingsScreen />);
  await fireEvent.changeText(screen.getByLabelText("Server address"), "192.168.1.20");
  await fireEvent.press(screen.getByRole("button", { name: "Connect" }));
  expect(connect).toHaveBeenCalledWith("192.168.1.20");
});
