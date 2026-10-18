import { ApiError } from "../../utils/apiError.js";

const MODEL = process.env.OPENAI_MODEL || "gpt-6-luna";

const lessonNoteSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "previousKnowledge",
    "learningObjectives",
    "instructionalMaterials",
    "introduction",
    "lessonDevelopment",
    "evaluationQuestions",
    "conclusion",
    "assignment",
  ],
  properties: {
    previousKnowledge: { type: "string" },
    learningObjectives: {
      type: "array",
      items: { type: "string" },
    },
    instructionalMaterials: {
      type: "array",
      items: { type: "string" },
    },
    introduction: { type: "string" },
    lessonDevelopment: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "stage",
          "teacherActivities",
          "learnerActivities",
        ],
        properties: {
          stage: { type: "string" },
          teacherActivities: { type: "string" },
          learnerActivities: { type: "string" },
        },
      },
    },
    evaluationQuestions: {
      type: "array",
      items: { type: "string" },
    },
    conclusion: { type: "string" },
    assignment: { type: "string" },
  },
};

export async function generateLessonNoteWithAI(input) {
  if (!process.env.OPENAI_API_KEY) {
    throw new ApiError(
      503,
      "AI lesson-note generation is not configured."
    );
  }

  const {
    subject,
    className,
    classLevel,
    topic,
    durationMinutes,
    learningObjectives,
    curriculumRequirements,
  } = input;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: MODEL,
          instructions: [
            "You are an educational lesson-note assistant for Nigerian schools.",
            "Create a clear, age-appropriate lesson note for the supplied class and subject.",
            "Use the supplied curriculum requirements when provided.",
            "Do not invent official curriculum references or claim verified alignment without evidence.",
            "Use practical examples and activities suitable for the learners.",
            "Return a useful draft for a teacher to review and edit.",
            "Keep the lesson development organized into teaching stages.",
            "Do not include student personal data.",
          ].join(" "),
          input: JSON.stringify({
            subject,
            className,
            classLevel,
            topic,
            durationMinutes,
            learningObjectives,
            curriculumRequirements,
          }),
          text: {
            format: {
              type: "json_schema",
              name: "lesson_note",
              strict: true,
              schema: lessonNoteSchema,
            },
          },
          max_output_tokens: 3500,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("OpenAI lesson-note request failed:", {
        status: response.status,
        error: result?.error?.message,
      });

      throw new ApiError(
        502,
        "The AI service could not generate the lesson note. Please try again."
      );
    }

    const outputText =
      result.output_text ||
      result.output
        ?.flatMap((item) => item.content || [])
        .find((item) => item.type === "output_text")
        ?.text;

    if (!outputText) {
      throw new ApiError(
        502,
        "The AI service returned no lesson-note content."
      );
    }

    let content;

    try {
      content = JSON.parse(outputText);
    } catch {
      throw new ApiError(
        502,
        "The AI response was not valid structured content."
      );
    }

    return content;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error.name === "AbortError") {
      throw new ApiError(
        504,
        "Lesson-note generation timed out. Please try again."
      );
    }

    console.error("Lesson-note AI error:", error.message);

    throw new ApiError(
      502,
      "Unable to contact the AI service. Please try again."
    );
  } finally {
    clearTimeout(timeout);
  }
}
