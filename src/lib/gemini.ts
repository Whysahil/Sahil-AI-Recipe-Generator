// src/lib/gemini.ts

// Switched to OpenAI for text generation; Gemini imports removed.

// --- Enhanced Recipe Interface ---
export interface Recipe {
  title: string;
  description?: string; // Added: Short description of the dish
  ingredients: string[];
  instructions: string;
  prepTime?: string; // Added: e.g., "15 minutes"
  cookTime?: string; // Added: e.g., "30 minutes"
  totalTime?: string; // Added: Optional, AI might calculate
  servings?: string; // Added: e.g., "4 servings"
  difficulty?: 'Easy' | 'Medium' | 'Hard' | string; // Added: Simple difficulty rating
  macros?: { // Added: Estimated macronutrients per serving
    calories?: string; // e.g., "450 kcal"
    protein?: string; // e.g., "30g"
    carbs?: string; // e.g., "40g"
    fat?: string; // e.g., "20g"
  };
  reasoning?: string; // Added: AI's explanation for the recipe choice
  tips?: string[]; // Added: Optional cooking tips or variations
  imageUrl?: string; // Added: URL to generated image (base64 or remote)
  tags?: string[]; // Added: User-defined tags for organization/filtering
  userRating?: number; // Added: User's personal rating (1-5)
  userNotes?: string; // Added: User's personal notes about the recipe
}

// --- OpenAI Client Helpers ---
type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
type ProxyPayload = {
  messages: ChatMessage[];
  temperature?: number;
  model?: string;
};

const callOpenAI = async (messages: ChatMessage[], temperature = 0.7): Promise<string> => {
  const apiBase = import.meta.env.VITE_API_BASE || ""; // leave empty for same-origin
  const resp = await fetch(`${apiBase}/api/generate-recipe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, temperature } satisfies ProxyPayload),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenAI proxy error (${resp.status}): ${text}`);
  }

  const data = await resp.json();
  const content = data?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Invalid response format from OpenAI proxy");
  }
  return content;
};

// --- Parsing Function ---

/**
 * Extracts content for a specific section using a regex.
 * Looks for a heading and captures text until the next heading or end of text.
 * @param text - The text block to search within.
 * @param headingRegex - Regex to match the section heading (e.g., /^Title:/i).
 * @param nextHeadingsPattern - A string pattern of possible next headings (e.g., "Ingredients:|Instructions:|Macros:").
 * @returns The trimmed content of the section, or null if not found.
 */
const extractSection = (text: string, headingRegex: RegExp, nextHeadingsPattern: string): string | null => {
    const match = text.match(headingRegex);
    if (!match || match.index === undefined) return null;

    const startIndex = match.index + match[0].length;
    // Regex to find the start of the *next* section heading or end of string
    // Need to handle potential leading whitespace before next heading
    const nextHeadingRegex = new RegExp(`^\\s*(?:${nextHeadingsPattern}|$)`, "im"); // i=case-insensitive, m=multiline
    const remainingText = text.substring(startIndex);
    const endMatch = remainingText.match(nextHeadingRegex);
    const endIndex = endMatch && endMatch.index !== undefined ? endMatch.index : remainingText.length;

    return remainingText.substring(0, endIndex).trim();
};

/**
 * Parses the raw text response from Gemini into a structured Recipe object,
 * including optional fields like description, times, macros, reasoning, and tips.
 * @param text - The raw text response from the Gemini API.
 * @returns A Recipe object.
 */
const parseRecipeResponse = (text: string): Recipe => {
  text = text.trim() + "\n"; // Add newline at end to help regex termination

  const recipe: Partial<Recipe> = {}; // Use Partial for incremental building

  const nextHeadings = "Description:|Ingredients:|Instructions:|Prep Time:|Cook Time:|Total Time:|Servings:|Difficulty:|Macros:|Reasoning:|Tips:";

  // --- Extract Sections ---
  recipe.title = extractSection(text, /^(?:Title:?|Recipe Name:?)\s*/im, nextHeadings) || "Untitled Recipe";
  recipe.description = extractSection(text, /^(?:Description:?)\s*/im, nextHeadings) || undefined;
  recipe.prepTime = extractSection(text, /^(?:Prep Time:?)\s*/im, nextHeadings) || undefined;
  recipe.cookTime = extractSection(text, /^(?:Cook Time:?)\s*/im, nextHeadings) || undefined;
  recipe.totalTime = extractSection(text, /^(?:Total Time:?)\s*/im, nextHeadings) || undefined;
  recipe.servings = extractSection(text, /^(?:Servings:?)\s*/im, nextHeadings) || undefined;
  recipe.difficulty = extractSection(text, /^(?:Difficulty:?)\s*/im, nextHeadings) || undefined;
  recipe.reasoning = extractSection(text, /^(?:Reasoning:?)\s*/im, nextHeadings) || undefined;
  recipe.tags = []; // Initialize empty tags array
  recipe.userRating = undefined; // Initialize empty user rating
  recipe.userNotes = undefined; // Initialize empty user notes

  // Ingredients (list)
  const ingredientsText = extractSection(text, /^(?:Ingredients?:?)\s*/im, nextHeadings);
  recipe.ingredients = ingredientsText
    ? ingredientsText.split('\n').map(item => item.trim().replace(/^[-*]\s*/, '')).filter(Boolean)
    : [];

  // Instructions (potentially multi-line)
  recipe.instructions = extractSection(text, /^(?:Instructions?:?)\s*/im, nextHeadings) || "";

  // Tips (list)
  const tipsText = extractSection(text, /^(?:Tips?:?|Variations?:?)\s*/im, nextHeadings);
  recipe.tips = tipsText
    ? tipsText.split('\n').map(item => item.trim().replace(/^[-*]\s*/, '')).filter(Boolean)
    : undefined;

  // Macros (nested object)
  const macrosText = extractSection(text, /^(?:Macros?:?)\s*(?:\(per serving\))?\s*/im, nextHeadings);
  if (macrosText) {
    recipe.macros = {};
    const calMatch = macrosText.match(/(?:Calories|Energy):\s*([^\n,]+)/i);
    const protMatch = macrosText.match(/Protein:\s*([^\n,]+)/i);
    const carbMatch = macrosText.match(/(?:Carbs?|Carbohydrates?):\s*([^\n,]+)/i);
    const fatMatch = macrosText.match(/Fat:\s*([^\n,]+)/i);
    if (calMatch) recipe.macros.calories = calMatch[1].trim();
    if (protMatch) recipe.macros.protein = protMatch[1].trim();
    if (carbMatch) recipe.macros.carbs = carbMatch[1].trim();
    if (fatMatch) recipe.macros.fat = fatMatch[1].trim();
  }

  // --- Final Log & Return ---
  console.log("--- Final Parsed Output (Enhanced) ---");
  console.log("Title:", recipe.title);
  console.log("Description:", recipe.description);
  console.log("Ingredients Count:", recipe.ingredients?.length);
  console.log("Instructions Length:", recipe.instructions?.length);
  console.log("Prep Time:", recipe.prepTime);
  console.log("Cook Time:", recipe.cookTime);
  console.log("Total Time:", recipe.totalTime);
  console.log("Servings:", recipe.servings);
  console.log("Difficulty:", recipe.difficulty);
  console.log("Macros:", recipe.macros);
  console.log("Reasoning:", recipe.reasoning);
  console.log("Tips:", recipe.tips);
  console.log("--------------------------------------");

  // Type assertion: We've built the object, assert it matches the full Recipe type
  // We provide defaults for required fields (title, ingredients, instructions)
  return recipe as Recipe;
};

/**
 * Generates a recipe image based on a recipe title and description
 * @param recipe The recipe object containing title and optionally description
 * @returns A Promise resolving to a base64-encoded image string or null if generation failed
 */
export const generateRecipeImage = async (recipe: Recipe): Promise<string | null> => {
  // Image generation disabled for now (no OpenAI image call here).
  return null;
};

// --- API Generation Functions ---

/**
 * Generates a recipe using the Gemini API based on user inputs, including optional details.
 * @returns A Promise resolving to a structured Recipe object with enhanced details.
 * @throws Throws an error if API call or parsing fails.
 */
export const generateRecipe = async (
  ingredients: string,
  dietaryPreferences: string[],
  cuisineStyle: string,
  mealType: string,
  cookingTime?: string,
  skillLevel?: string,
  servings?: string,
  equipment?: string,
  nutritionalGoals?: string
): Promise<Recipe> => {
  console.log("Generating recipe with inputs:", { ingredients, dietaryPreferences, cuisineStyle, mealType, cookingTime, skillLevel, servings, equipment, nutritionalGoals });
  try {
    const dietString = dietaryPreferences.length > 0 ? dietaryPreferences.join(', ') : 'None';
    const nutritionalGoalsPrompt = nutritionalGoals
      ? `\n- Nutritional Goals: ${nutritionalGoals} (ensure the recipe meets these requirements)`
      : '';

    const userPrompt = `
Generate a detailed recipe based strictly on the following details. Use the exact headings provided and include all sections. If something is unknown, provide a reasonable estimate or use "N/A".

**Recipe Requirements:**
- Meal Type: ${mealType || 'Any'}
- Cuisine Style: ${cuisineStyle || 'Any'}
- Dietary Restrictions: ${dietString}
- Key Ingredients Provided: ${ingredients}${nutritionalGoalsPrompt}
${cookingTime ? `- Target Cooking Time: ${cookingTime}` : ''}
${skillLevel ? `- Target Skill Level: ${skillLevel}` : ''}
${servings ? `- Desired Number of Servings: ${servings}` : ''}
${equipment ? `- Specific Equipment Available: ${equipment}` : ''}

**Output Format (use these exact headings):**
Title:
Description:
Prep Time:
Cook Time:
Total Time:
Servings:
Difficulty:
Ingredients:
Instructions:
Macros:
Reasoning:
Tips:
`;

    const responseText = await callOpenAI([
      {
        role: "system",
        content: "You are a concise, detail-oriented chef AI. Always respond using the requested headings and keep formatting tight for easy parsing.",
      },
      { role: "user", content: userPrompt },
    ]);

    console.log("--- Raw OpenAI Recipe Response ---");
    console.log(responseText);
    console.log("---------------------------------");

    const parsedRecipe = parseRecipeResponse(responseText);

    try {
      const imageBase64 = await generateRecipeImage(parsedRecipe);
      if (imageBase64) {
        parsedRecipe.imageUrl = `data:image/jpeg;base64,${imageBase64}`;
      }
    } catch (imageError) {
      console.error("Failed to generate recipe image:", imageError);
    }

    return parsedRecipe;
  } catch (error) {
    console.error("Error in generateRecipe function:", error);
    throw new Error(`Failed to generate recipe: ${error instanceof Error ? error.message : 'Unknown AI error'}`);
  }
};

/**
 * Generates a modified recipe with scaled ingredients based on the original recipe
 * @param recipe The original recipe to scale
 * @param servings The new number of servings
 * @returns A Promise resolving to a new Recipe object with scaled ingredients
 */
export const scaleRecipe = async (recipe: Recipe, newServings: number): Promise<Recipe> => {
  try {
    if (!recipe) throw new Error("No recipe provided for scaling");

    // Extract the current servings number from the servings string
    const currentServingsMatch = recipe.servings?.match(/(\d+)/);
    const currentServings = currentServingsMatch ? parseInt(currentServingsMatch[1], 10) : 4; // Default to 4 if not found

    // Convert ingredients array to string for the prompt
    const ingredientsList = recipe.ingredients.join('\n');

    const userPrompt = `
Scale the following recipe from ${currentServings} servings to ${newServings} servings.
Scale only the ingredient quantities proportionally and keep ingredient names unchanged.

ORIGINAL INGREDIENTS:
${ingredientsList}

Output only the scaled ingredient list, one item per line, preserving bullets if present.
`;

    const scaledIngredientsText = await callOpenAI([
      {
        role: "system",
        content: "You are a precise culinary assistant. Only return the scaled ingredients list with sensible rounding.",
      },
      { role: "user", content: userPrompt },
    ], 0.2);

    if (!scaledIngredientsText) {
      throw new Error("Failed to get scaled ingredients from AI");
    }

    const scaledIngredients = scaledIngredientsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.replace(/^[-*•]\s*/, ''));

    const scaledRecipe: Recipe = {
      ...recipe,
      ingredients: scaledIngredients,
      servings: `${newServings} servings`,
    };

    return scaledRecipe;
  } catch (error) {
    console.error("Error scaling recipe:", error);
    throw new Error(`Failed to scale recipe: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Generates substitution suggestions for a specific ingredient in a recipe
 * @param ingredient The ingredient to find substitutions for
 * @param recipe Optional context of the recipe for better substitutions
 * @returns A Promise resolving to an array of substitution options
 */
export const generateIngredientSubstitutions = async (
  ingredient: string, 
  recipe?: Recipe
): Promise<{substitution: string, notes: string}[]> => {
  try {
    let prompt = `
Suggest 3-5 practical substitutions for "${ingredient}" in cooking. 

For each substitution:
1. Name the alternative ingredient
2. Provide a brief note on how it affects the dish (taste, texture, etc.)
3. Include the appropriate quantity conversion if applicable

Format each substitution as:
{
  "substitution": "Alternative ingredient with quantity if needed",
  "notes": "Brief note about taste/texture changes and usage tips"
}
`;

    // Add recipe context if available
    if (recipe) {
      prompt += `\n\nThis is for a ${recipe.title} recipe. Consider the compatibility with these other ingredients: ${recipe.ingredients.slice(0, 5).join(', ')}`;
    }

    const responseText = await callOpenAI([
      {
        role: "system",
        content: "You are a culinary substitution expert. Always respond in compact JSON array form unless instructed otherwise.",
      },
      { role: "user", content: prompt },
    ], 0.4);

    // Parse the response text into JSON format
    // First, try to extract just the JSON array portion if it exists
    const jsonMatch = responseText.match(/\[\s*\{.*\}\s*\]/s);
    let substitutionsJson: string;
    
    if (jsonMatch) {
      substitutionsJson = jsonMatch[0];
    } else {
      // Fallback: try to clean up the text to make it valid JSON
      substitutionsJson = responseText
        .replace(/```json/g, '') // Remove markdown code block markers
        .replace(/```/g, '')
        .trim();
      
      // If it doesn't start with [ and end with ], wrap it
      if (!substitutionsJson.startsWith('[')) {
        substitutionsJson = '[' + substitutionsJson;
      }
      if (!substitutionsJson.endsWith(']')) {
        substitutionsJson = substitutionsJson + ']';
      }
    }
    
    try {
      return JSON.parse(substitutionsJson);
    } catch (parseError) {
      console.error("Failed to parse substitutions JSON:", parseError);
      console.log("Raw response:", responseText);
      throw new Error("Failed to parse ingredient substitutions");
    }
  } catch (error) {
    console.error("Error generating ingredient substitutions:", error);
    throw new Error(`Failed to get substitutions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Generates a chat response, potentially including a modified recipe with full details.
 * @returns A Promise resolving to an object containing the chat message and optionally a new Recipe object.
 */
export const generateChatResponse = async (
  userMessage: string,
  currentRecipe?: Recipe | null
): Promise<{ message: string; recipe: Recipe | null }> => {
  console.log("Generating chat response for:", userMessage, "with recipe context:", !!currentRecipe);
  try {
    let prompt = '';

    // --- Updated Chat Prompt ---
    // Shared output format instruction for consistency
    const recipeOutputFormat = `
**Output Format for NEW/MODIFIED Recipes (Use these exact headings):**
[Optional brief acknowledgement of the request]

Title:
[New recipe title]

Description:
[Brief description]

Prep Time:
[Estimated prep time]

Cook Time:
[Estimated cook time]

Total Time:
[Estimated total time]

Servings:
[Number of servings]

Difficulty:
[Easy, Medium, or Hard]

Ingredients:
[List all ingredients, one per line, starting with '*' or '-'.]

Instructions:
[Full step-by-step instructions, numbered.]

Macros:
[Estimated macros per serving: Calories, Protein, Carbs, Fat]

Reasoning:
[Brief explanation for the modification/choice]

Tips:
[Optional tips/variations]
`;

    if (currentRecipe) {
      const ingredientsStr = currentRecipe.ingredients.join('\n');
      prompt = `
You are an AI chef assistant helping a user with a specific recipe.

**Current Recipe Context:**
Title: ${currentRecipe.title}
Ingredients:
${ingredientsStr}
Instructions:
${currentRecipe.instructions}
${currentRecipe.prepTime ? `Prep Time: ${currentRecipe.prepTime}` : ''}
${currentRecipe.cookTime ? `Cook Time: ${currentRecipe.cookTime}` : ''}

**User's Request:** "${userMessage}"

**Your Task:**
1.  Analyze the user's request regarding the current recipe.
2.  If asking for a **modification**, provide a brief acknowledgement AND generate a **completely new, modified recipe** with all details (Title, Description, Times, Servings, Difficulty, Ingredients, Instructions, Macros, Reasoning, Tips) using the format below.
3.  If asking a **general question** about the current recipe, provide a helpful, concise answer *without* generating a new recipe.
4.  If asking for something unrelated, respond appropriately.

${recipeOutputFormat}

**Output Format for General Questions:**
[Provide a direct, helpful answer.]
`;
    } else {
      // General chat without recipe context
      prompt = `
You are an AI chef assistant.

**User's Request:** "${userMessage}"

**Your Task:**
1.  Analyze the request.
2.  If asking for a **recipe**, generate a complete recipe with all details (Title, Description, Times, Servings, Difficulty, Ingredients, Instructions, Macros, Reasoning, Tips) using the format below.
3.  If asking a **general cooking question**, provide a helpful, concise answer.
4.  If conversational, respond naturally.

${recipeOutputFormat}

**Output Format for General Questions:**
[Provide a direct, helpful answer.]
`;
    }

    console.log("--- Sending Chat Prompt to OpenAI ---");
    console.log("------------------------------------");

    const responseText = await callOpenAI([
      {
        role: "system",
        content: "You are an expert chef assistant. When generating recipes, strictly follow the provided headings. Keep responses concise and parse-friendly.",
      },
      { role: "user", content: prompt },
    ]);

    console.log("--- Raw OpenAI Chat Response ---");
    console.log(responseText);
    console.log("--------------------------------");

    // --- Parse Chat Response ---
    // Check for the core recipe headings to determine if a recipe was likely generated
    const containsTitle = /^\s*Title:/im.test(responseText);
    const containsIngredients = /^\s*Ingredients:/im.test(responseText);
    const containsInstructions = /^\s*Instructions:/im.test(responseText);

    if (containsTitle && containsIngredients && containsInstructions) {
      // Attempt to parse the full recipe details
      const parsedRecipe = parseRecipeResponse(responseText); // Use enhanced parser

      // Extract any text *before* the "Title:" heading
      const messageMatch = responseText.match(/^([\s\S]*?)(?=^\s*Title:)/im);
      // Provide a more informative default message if needed
      const message = messageMatch ? messageMatch[1].trim() : (currentRecipe ? "Okay, I've modified the recipe for you:" : "Here is the recipe I generated:");

      console.log("Chat response parsed as: Recipe included (Enhanced)");
      return {
        message: message,
        recipe: parsedRecipe // Return the full Recipe object
      };
    } else {
      // Treat the whole response as a text message
      console.log("Chat response parsed as: General message");
      return {
        message: responseText.trim(),
        recipe: null
      };
    }
  } catch (error) {
    console.error("Error in generateChatResponse function:", error);
     throw new Error(`Failed to get chat response: ${error instanceof Error ? error.message : 'Unknown AI error'}`);
  }
};
