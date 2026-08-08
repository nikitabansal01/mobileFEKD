import { resolvePlanImageSource } from "../components/PlanImage";

describe("PlanImage fallback", () => {
  it("uses an HTTPS media asset while it remains healthy", () => {
    expect(
      resolvePlanImageSource(
        { public_url: "https://images.auvra.com/plan/hero.webp" },
        false,
        77,
      ),
    ).toEqual({
      kind: "remote",
      source: { uri: "https://images.auvra.com/plan/hero.webp" },
    });
  });

  it.each([
    [{ public_url: "" }, false],
    [{ public_url: "http://insecure.example/image.png" }, false],
    [{ public_url: "https://images.auvra.com/broken.webp" }, true],
    [null, false],
  ] as const)(
    "uses a bundled fallback for missing, insecure, or failed images",
    (image, failed) => {
      expect(resolvePlanImageSource(image, failed, 77)).toEqual({
        kind: "fallback",
        source: 77,
      });
    },
  );
});
