import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserData, ProjectionResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const PROJECTION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    career: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Likely job title or status (e.g., 'BCS Cadre', 'Struggling Junior Dev', 'Unemployed in Dhaka', 'PhD Candidate')" },
        description: { type: Type.STRING, description: "3-4 short sentences describing the work reality in Bangladesh or abroad." },
        incomeRange: { type: Type.STRING, description: "Approximate monthly income range in BDT or currency if abroad (e.g., '30k - 40k BDT', '$2000 stipend')." },
        satisfaction: { type: Type.STRING, description: "Neutral description of work satisfaction." },
      },
      required: ["title", "description", "incomeRange", "satisfaction"],
    },
    skills: {
      type: Type.OBJECT,
      properties: {
        depth: { type: Type.STRING, description: "Skill depth relative to peers." },
        confidence: { type: Type.STRING, description: "Confidence level in professional settings." },
      },
      required: ["depth", "confidence"],
    },
    dailyLife: {
      type: Type.OBJECT,
      properties: {
        living: { type: Type.STRING, description: "Living situation (e.g., 'Shared flat in Mirpur', 'Dormitory abroad')." },
        routine: { type: Type.STRING, description: "Stability of daily routine." },
        relationshipWithTime: { type: Type.STRING, description: "How they feel about time." },
      },
      required: ["living", "routine", "relationshipWithTime"],
    },
    internalState: {
      type: Type.OBJECT,
      properties: {
        stress: { type: Type.STRING, description: "Baseline stress level." },
        regret: { type: Type.STRING, description: "Subtle wording about regret or acceptance." },
        momentum: { type: Type.STRING, description: "Sense of momentum or stagnation." },
      },
      required: ["stress", "regret", "momentum"],
    },
  },
};

export const generateProjection = async (userData: UserData): Promise<ProjectionResult> => {
  const model = "gemini-3-flash-preview";

  const prompt = `
    Context: You are a "Time Machine" for students at RUET (Rajshahi University of Engineering & Technology). 
    Your task is to provide a realistic, 5-year probabilistic projection of the student's life based on their CURRENT habits and ACADEMIC STANDING.
    
    CRITICAL CONTEXT (BANGLADESH):
    1. **CGPA is King (Locally):** 
       - CGPA < 3.00: Very hard to get Govt jobs (some have cutoffs), impossible to get University teaching, hard to get good Masters abroad without killer GRE/Publications.
       - CGPA 3.00-3.50: The average struggle. Corporate jobs in Dhaka depend on skills.
       - CGPA 3.75+: Golden ticket for Scholarships/Teaching.
    
    2. **Career Paths:**
       - **BCS/Govt:** Requires insane study hours (General Knowledge). If 'Study Habits' are low, they will fail here.
       - **Corporate/Dev:** Skills matter more than CGPA, but networking ('Campus Life') helps.
       - **Higher Study:** Needs CGPA + Research.
    
    3. **Social Life (Tong/Adda):**
       - Too much = Distraction/Backlogs. 
       - Too little = No network/social awkwardness.
    
    TONE GUIDE:
    - Neutral, cold, observational.
    - NO advice. NO motivation.
    - Be realistic about the "Dhaka Traffic" life vs "Abroad" life.
    - If they have Low CGPA + High Ambition (e.g., University Teacher), show the reality check (likely unemployed or compromising).
    
    INPUT DATA:
    Department: ${userData.department}
    Semester: ${userData.semester}
    Current CGPA: ${userData.currentCGPA}
    Primary Goal: ${userData.careerGoal}
    Study Habits (0-100): ${userData.studyConsistency}
    Class Attendance (0-100): ${userData.classAttendance}
    Campus Social Life (0-100): ${userData.campusLife}
    Skill Building (0-100): ${userData.skillBuilding}
    Daily Screen Time (0-100): ${userData.dailyScreenTime}

    Generate a JSON response describing their life in 5 years.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: PROJECTION_SCHEMA,
        temperature: 0.3, 
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response generated");
    
    return JSON.parse(text) as ProjectionResult;
  } catch (error) {
    console.error("Projection error:", error);
    throw new Error("The timeline is blurry. Please try again.");
  }
};