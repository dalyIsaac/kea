import * as assert from "assert";
import sinon from "sinon";
import * as vscode from "vscode";
import { IKeaContext } from "../core/context";
import { Logger } from "../core/logger";
import { createKeaContextStub } from "../test-utils";
import { CommandManager } from "./command-manager";
import { KEA_COMMANDS } from "./command-manager-types";

suite("CommandManager", () => {
  let sandbox: sinon.SinonSandbox;
  let contextStub: IKeaContext;
  let registerCommandStub: sinon.SinonStub;
  let executeCommandStub: sinon.SinonStub;
  let loggerDebugStub: sinon.SinonStub;
  let commandStubs: Record<string, sinon.SinonStub>;

  setup(() => {
    sandbox = sinon.createSandbox();
    contextStub = createKeaContextStub();

    // Create stub for each command creator function
    commandStubs = {};
    Object.keys(KEA_COMMANDS).forEach((commandName) => {
      const commandStub = sandbox.stub().resolves();
      commandStubs[commandName] = commandStub;

      // Mock the command creation function to return our stub
      // @ts-expect-error - Using sinon to stub an object with string indices
      sandbox.stub(KEA_COMMANDS, commandName).returns(() => commandStub);
    });

    // Stub VS Code's registerCommand and executeCommand functions
    registerCommandStub = sandbox.stub(vscode.commands, "registerCommand").returns({
      dispose: sandbox.stub(),
    } as vscode.Disposable);
    executeCommandStub = sandbox.stub(vscode.commands, "executeCommand").resolves();

    // Stub logger
    loggerDebugStub = sandbox.stub(Logger, "debug");
  });

  teardown(() => {
    sandbox.restore();
  });

  test("constructor registers all commands from COMMANDS", () => {
    // When
    new CommandManager(contextStub);

    // Then
    const commandNames = Object.keys(KEA_COMMANDS);
    assert.strictEqual(registerCommandStub.callCount, commandNames.length, `Should register ${commandNames.length} commands`);

    commandNames.forEach((commandName) => {
      const wasRegistered = registerCommandStub.calledWith(commandName, sinon.match.any);
      assert.ok(wasRegistered, `Command ${commandName} should be registered`);
    });
  });

  test("constructor initializes commands map", () => {
    // When
    new CommandManager(contextStub);

    // Then - can't directly access private field, but we can test indirectly
    // by checking that commands were registered
    assert.strictEqual(registerCommandStub.callCount, Object.keys(KEA_COMMANDS).length, "Should register all commands from COMMANDS");
  });

  test("executeCommand calls VS Code's executeCommand with correct parameters", async () => {
    // Given
    const commandManager = new CommandManager(contextStub);
    const commandName = "kea.openPullRequest";

    // When
    await commandManager.executeCommand(commandName, contextStub);

    // Then
    assert.ok(loggerDebugStub.calledOnce, "Should log debug message");
    assert.ok(loggerDebugStub.calledWith(`Executing command: ${commandName}`, contextStub), "Should log command name");

    assert.ok(executeCommandStub.calledOnce, "VS Code's executeCommand should be called once");
    assert.ok(executeCommandStub.calledWith(commandName, contextStub), "VS Code's executeCommand should be called with correct parameters");
  });

  test("executeCommand passes arguments correctly", async () => {
    // Given
    const commandManager = new CommandManager(contextStub);
    const commandName = "kea.openPullRequest";

    // When
    await commandManager.executeCommand(commandName, contextStub);

    // Then
    assert.ok(loggerDebugStub.calledWith(`Executing command: ${commandName}`, contextStub), "Should log command name and arguments");

    assert.ok(executeCommandStub.calledWith(commandName, contextStub), "VS Code's executeCommand should pass arguments correctly");
  });

  test("dispose unregisters all commands", async () => {
    // Given
    const disposeSpy = sinon.spy();
    registerCommandStub.returns({ dispose: disposeSpy });
    const commandManager = new CommandManager(contextStub);

    // When
    await commandManager.dispose();

    // Then
    const commandCount = Object.keys(KEA_COMMANDS).length;
    assert.strictEqual(disposeSpy.callCount, commandCount, `Should dispose ${commandCount} registered commands`);
  });
});
