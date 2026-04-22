import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { compressImage } from "@/lib/imageCompression";

// jsdom doesn't provide a full HTMLImageElement / canvas pipeline. We stub
// the browser APIs compressImage relies on so the pure shape of the
// function — dimension math, revoke cleanup, promise resolution — can be
// asserted without a real image decode.

function stubEnv({
  imgNaturalWidth,
  imgNaturalHeight,
  failLoad = false,
}: {
  imgNaturalWidth: number;
  imgNaturalHeight: number;
  failLoad?: boolean;
}) {
  const created: { objectUrls: string[]; revokedUrls: string[] } = {
    objectUrls: [],
    revokedUrls: [],
  };

  // URL.createObjectURL / revokeObjectURL
  const urlMock = {
    createObjectURL: vi.fn((_blob: Blob) => {
      const url = `blob:stub/${created.objectUrls.length}`;
      created.objectUrls.push(url);
      return url;
    }),
    revokeObjectURL: vi.fn((url: string) => {
      created.revokedUrls.push(url);
    }),
  };
  vi.stubGlobal("URL", { ...URL, ...urlMock });

  // HTMLImageElement — set width/height, fire onload/onerror synchronously
  class StubImage {
    onload: (() => void) | null = null;
    onerror: ((ev: unknown) => void) | null = null;
    width = imgNaturalWidth;
    height = imgNaturalHeight;
    set src(_val: string) {
      // schedule async to mimic real browser behavior
      queueMicrotask(() => {
        if (failLoad) this.onerror?.(new Error("decode failed"));
        else this.onload?.();
      });
    }
  }
  vi.stubGlobal("Image", StubImage as unknown as typeof Image);

  // Canvas toBlob — return a tiny jpeg-typed Blob
  const originalCreateElement = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag !== "canvas") return originalCreateElement(tag);
    const canvas = originalCreateElement("canvas") as HTMLCanvasElement;
    canvas.getContext = vi.fn(() => ({ drawImage: vi.fn() })) as unknown as typeof canvas.getContext;
    canvas.toBlob = vi.fn((cb: BlobCallback, type?: string) => {
      const blob = new Blob(["stub"], { type: type ?? "image/jpeg" });
      queueMicrotask(() => cb(blob));
    }) as typeof canvas.toBlob;
    return canvas;
  });

  return { created, urlMock };
}

describe("compressImage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a jpeg Blob", async () => {
    stubEnv({ imgNaturalWidth: 800, imgNaturalHeight: 600 });
    const file = new File(["data"], "x.jpg", { type: "image/jpeg" });
    const blob = await compressImage(file, 1200);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("image/jpeg");
  });

  it("downscales images whose longest side exceeds maxDim", async () => {
    // 2400×1200 → longest side is 2400; maxDim=1200 → 0.5 ratio → canvas
    // should be 1200×600. We install a minimal manual stub here
    // (instead of stubEnv) so we can observe width/height setters on
    // the canvas without stubEnv's canvas mocking clobbering them.
    const realCreateElement = document.createElement.bind(document);
    const canvasSpy = { width: 0, height: 0 };
    const fakeCanvas = {
      get width() {
        return canvasSpy.width;
      },
      set width(v: number) {
        canvasSpy.width = v;
      },
      get height() {
        return canvasSpy.height;
      },
      set height(v: number) {
        canvasSpy.height = v;
      },
      getContext: () => ({ drawImage: () => {} }),
      toBlob: (cb: BlobCallback, type?: string) => {
        queueMicrotask(() => cb(new Blob([], { type: type ?? "image/jpeg" })));
      },
    };
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "canvas") return fakeCanvas as unknown as HTMLCanvasElement;
      return realCreateElement(tag);
    });
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:stub/0"),
      revokeObjectURL: vi.fn(),
    });
    class StubImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      width = 2400;
      height = 1200;
      set src(_val: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal("Image", StubImage as unknown as typeof Image);

    const file = new File(["data"], "x.jpg", { type: "image/jpeg" });
    await compressImage(file, 1200);
    expect(canvasSpy.width).toBe(1200);
    expect(canvasSpy.height).toBe(600);
  });

  it("revokes the object URL after successful compression", async () => {
    const { created } = stubEnv({ imgNaturalWidth: 500, imgNaturalHeight: 500 });
    const file = new File(["data"], "x.jpg", { type: "image/jpeg" });
    await compressImage(file, 1200);
    expect(created.objectUrls.length).toBe(1);
    expect(created.revokedUrls).toEqual(created.objectUrls);
  });

  it("revokes the object URL on decode failure and rejects", async () => {
    const { created } = stubEnv({
      imgNaturalWidth: 0,
      imgNaturalHeight: 0,
      failLoad: true,
    });
    const file = new File(["data"], "x.jpg", { type: "image/jpeg" });
    await expect(compressImage(file, 1200)).rejects.toBeDefined();
    expect(created.revokedUrls).toEqual(created.objectUrls);
  });
});
