import { describe, it, expect, vi } from "vitest";

vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(function () {
    return {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                word: "perspicacious",
                wordDefinition: "Having a ready insight into things; shrewd.",
                wordCasual: "She was surprisingly perspicacious about people.",
                wordBusiness: "His perspicacious reading of the market gave us an edge.",
                wordTechnical: "A perspicacious engineer catches race conditions before they ship.",
                techTip: "Use database connection pooling to avoid exhausting connections under load.",
                quote: "It is better to be feared than loved, if you cannot be both.",
                quoteAuthor: "Niccolò Machiavelli",
                mentalModel: "Inversion",
                mentalModelExplanation:
                  "Instead of asking how to succeed, ask what would guarantee failure and avoid it. Invert the problem to reveal hidden risks and overlooked assumptions.",
                poem: "Do not go gentle into that good night,\nOld age should burn and rave at close of day;\nRage, rage against the dying of the light.",
                poemTitle: "Do Not Go Gentle into That Good Night",
                poemAuthor: "Dylan Thomas",
              }),
            },
          ],
        }),
      },
    };
  }),
}));

import { generateDailyContent } from "../daily-growth";

describe("generateDailyContent", () => {
  it("returns all required fields from the API response", async () => {
    const result = await generateDailyContent();
    expect(result.word).toBe("perspicacious");
    expect(result.wordDefinition).toContain("insight");
    expect(result.wordCasual).toBeTruthy();
    expect(result.wordBusiness).toBeTruthy();
    expect(result.wordTechnical).toBeTruthy();
    expect(result.techTip).toBeTruthy();
    expect(result.quote).toBeTruthy();
    expect(result.quoteAuthor).toBe("Niccolò Machiavelli");
    expect(result.mentalModel).toBe("Inversion");
    expect(result.mentalModelExplanation).toBeTruthy();
    expect(result.poem).toBeTruthy();
    expect(result.poemTitle).toBe("Do Not Go Gentle into That Good Night");
    expect(result.poemAuthor).toBe("Dylan Thomas");
  });

  it("throws when the API returns invalid JSON", async () => {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    (Anthropic as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(function () {
      return {
        messages: {
          create: vi.fn().mockResolvedValue({
            content: [{ type: "text", text: "not valid json at all" }],
          }),
        },
      };
    });
    await expect(generateDailyContent()).rejects.toThrow();
  });

  it("throws with a descriptive error when API returns non-text content", async () => {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    (Anthropic as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(function () {
      return {
        messages: {
          create: vi.fn().mockResolvedValue({
            content: [{ type: "tool_use", id: "x", name: "y", input: {} }],
          }),
        },
      };
    });
    await expect(generateDailyContent()).rejects.toThrow("Unexpected response type");
  });
});
