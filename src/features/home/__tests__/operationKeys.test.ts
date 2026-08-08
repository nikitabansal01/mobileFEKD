import { createOperationKeyStore } from "../operationKeys";

describe("Home operation keys", () => {
  it("reuses the same key for duplicate taps and retry after a transient failure", () => {
    const keys = createOperationKeyStore(
      jest
        .fn()
        .mockReturnValueOnce("action-key")
        .mockReturnValueOnce("review-key"),
    );

    expect(keys.get("event:plan:item:completed")).toBe("action-key");
    expect(keys.get("event:plan:item:completed")).toBe("action-key");
    expect(keys.get("review:plan:1")).toBe("review-key");
    keys.clear("review:plan:1");
  });
});
