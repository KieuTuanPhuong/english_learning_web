import { resolveQuestionType, parseFillBlank, buildAnswers, isComplete, Question, AnswerState } from "../lib/exercises";

describe("exercises helpers", () => {
  describe("resolveQuestionType", () => {
    it("should resolve true_false", () => {
      const q = { id: 1, text: "Sky is blue", options: [{ id: 1, text: "True" }, { id: 2, text: "False" }] } as any as Question;
      expect(resolveQuestionType(q)).toBe("true_false");
    });
    
    it("should resolve mcq", () => {
      const q = { id: 1, text: "Pick one", options: [{ id: 1, text: "A" }, { id: 2, text: "B" }, { id: 3, text: "C" }] } as any as Question;
      expect(resolveQuestionType(q)).toBe("mcq");
    });
    
    it("should resolve fill_blank", () => {
      const q = { id: 1, text: "The capital of France is [[Paris]].", options: [] } as any as Question;
      expect(resolveQuestionType(q)).toBe("fill_blank");
    });
    
    it("should resolve short_answer", () => {
      const q = { id: 1, text: "Why?", options: [] } as any as Question;
      expect(resolveQuestionType(q)).toBe("short_answer");
    });
  });

  describe("parseFillBlank", () => {
    it("should extract segments and answers", () => {
      const res = parseFillBlank("Hello [[World]], I am [[GPT]].");
      expect(res.segments).toEqual(["Hello ", ", I am ", "."]);
      expect(res.answers).toEqual(["World", "GPT"]);
    });
    
    it("should extract single blank", () => {
      const res = parseFillBlank("The capital is [[Paris]].");
      expect(res.segments).toEqual(["The capital is ", "."]);
      expect(res.answers).toEqual(["Paris"]);
    });
  });

  describe("isComplete", () => {
    it("validates mcq completeness", () => {
      const questions = [{ id: 1, text: "Q", options: [{ id: 1, text: "A" }, { id: 2, text: "B" }] }] as any as Question[];
      expect(isComplete(questions, {})).toBe(false);
      expect(isComplete(questions, { 1: { option_id: 1 } })).toBe(true);
    });
    
    it("validates fill_blank completeness", () => {
      const questions = [{ id: 1, text: "A [[B]] C [[D]]", options: [] }] as any as Question[];
      expect(isComplete(questions, {})).toBe(false);
      // Both answers filled
      expect(isComplete(questions, { 1: { text: JSON.stringify(["ans1", "ans2"]) } })).toBe(true);
      // One missing
      expect(isComplete(questions, { 1: { text: JSON.stringify(["ans1", ""]) } })).toBe(false);
    });
  });

  describe("buildAnswers", () => {
    it("builds payload", () => {
      const questions = [{ id: 1, text: "Q", options: [{ id: 1, text: "A" }, { id: 2, text: "B" }] }] as any as Question[];
      const state = { 1: { option_id: 2 } };
      const res = buildAnswers(questions, state);
      expect(res.version).toBe(1);
      expect(res.responses).toHaveLength(1);
      expect(res.responses[0]).toMatchObject({
        question_id: 1,
        type: "mcq",
        option_id: 2
      });
    });
  });
});
