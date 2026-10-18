
import { ApiError } from "../../utils/apiError.js";

const MODEL = process.env.OPENAI_MODEL || "gpt-6-luna";
const API_URL = "https://api.openai.com/v1/responses";

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

/**
 * Basic defensive validation before returning AI output.
 */
function validateGeneratedContent(content) {
  if (
    !content ||
    typeof content !== "object" ||
    Array.isArray(content)
  ) {
    return false;
  }

  const requiredStrings = [
    "previousKnowledge",
    "introduction",
    "conclusion",
    "assignment",
  ];

  for (const field of requiredStrings) {
    if (typeof content[field] !== "string") {
      return false;
    }
  }

  if (
    !Array.isArray(content.learningObjectives) ||
    !Array.isArray(content.instructionalMaterials) ||
    !Array.isArray(content.lessonDevelopment) ||
    !Array.isArray(content.evaluationQuestions)
  ) {
    return false;
  }

  if (content.learningObjectives.length === 0) {
    return false;
  }

  if (content.lessonDevelopment.length === 0) {
    return false;
  }

  return content.lessonDevelopment.every(
    (stage) =>
      stage &&
      typeof stage.stage === "string" &&
      typeof stage.teacherActivities === "string" &&
      typeof stage.learnerActivities === "string"
  );
}

export async function generateLessonNoteWithAI(input) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new ApiError(
      503,
      "AI lesson-note generation is not configured."
    );
  }

  if (!input?.subject || !input?.className || !input?.topic) {
    throw new ApiError(
      400,
      "Subject, class, and topic are required."
    );
  }

  const {
    subject,
    className,
    classLevel = "",
    session = "",
    term = "",
    topic,
    week = "",
    durationMinutes = 40,
    learningObjectives = [],
    curriculumRequirements = "",
  } = input;

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    60000
  );

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL,
        store: false,
        instructions: [
          "You are an educational lesson-note assistant for Nigerian schools.",
          "Create a detailed, clear, age-appropriate lesson note.",
          "Use Nigerian classroom examples where appropriate.",
          "Use the supplied curriculum requirements when provided.",
          "Never invent official curriculum references or claim verified alignment without evidence.",
          "If curriculum requirements are missing, create a general educational draft and do not claim official curriculum alignment.",
          "Make learning objectives observable and suitable for the specified class.",
          "Organize lesson development into logical teaching stages.",
          "Include practical teacher activities and learner activities for every stage.",
          "Create useful evaluation questions and a relevant assignment.",
          "Ensure the activities are realistic for the stated lesson duration.",
          "The teacher must review the generated content before classroom use.",
          "Return only content matching the required JSON schema.",
          "Do not include student personal data.",
        ].join(" "),
        input: JSON.stringify({
          subject,
          className,
          classLevel,
          session,
          term,
          topic,
          week,
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
    });

    let result;

    try {
      result = await response.json();
    } catch {
      throw new ApiError(
        502,
        "The AI service returned an unreadable response."
      );
    }

    if (!response.ok) {
      // Log only non-secret diagnostic information.
      console.error("OpenAI lesson-note request failed:", {
        status: response.status,
        error: result?.error?.message || "Unknown API error",
        model: MODEL,
      });

      if (response.status === 401 || response.status === 403) {
        throw new ApiError(
          502,
          "The AI service credentials or permissions need to be checked."
        );
      }

      if (response.status === 429) {
        throw new ApiError(
          503,
          "The AI service is temporarily rate-limited or has insufficient API quota. Please try again later."
        );
      }

      if (
        result?.error?.code === "model_not_found" ||
        result?.error?.code === "unsupported_value"
      ) {
        throw new ApiError(
          502,
          "The configured AI model is unavailable or does not support this request. Check OPENAI_MODEL."
        );
      }

      throw new ApiError(
        502,
        "The AI service could not generate the lesson note. Please try again."
      );
    }

    if (result.status === "incomplete") {
      throw new ApiError(
        502,
        "The generated lesson note was incomplete. Please try again."
      );
    }

    const outputText =
      result.output_text ||
      result.output
        ?.flatMap((item) => item.content || [])
        .find((item) => item.type === "output_text")
        ?.text;

    if (!outputText) {
      const refusal = result.output
        ?.flatMap((item) => item.content || [])
        .some((item) => item.type === "refusal");

      throw new ApiError(
        502,
        refusal
          ? "The AI could not generate this lesson note. Please revise the request."
          : "The AI service returned no lesson-note content."
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

    if (!validateGeneratedContent(content)) {
      throw new ApiError(
        502,
        "The AI returned an incomplete lesson note. Please try again."
      );
    }

    return content;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error.name === "AbortError") {
      throw new ApiError(
        504,
        "Lesson-note generation timed out. Please try again."
      );
    }

    console.error("Lesson-note AI connection error:", {
      message: error.message,
      model: MODEL,
    });

    throw new ApiError(
      502,
      "Unable to contact the AI service. Please try again."
    );
  } finally {
    clearTimeout(timeout);
  }
}
