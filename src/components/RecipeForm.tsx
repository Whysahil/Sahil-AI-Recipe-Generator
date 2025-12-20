import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { UtensilsCrossed, ChefHat, Loader2, RefreshCw } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { generateRecipe } from '@/lib/gemini';
import type { Recipe } from '@/lib/gemini';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserProfile } from '@/lib/appwrite'; // Changed import from getUserPreferences
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
// Removed UserPreferences import as UserProfileData is used implicitly
// import type { UserPreferences } from '@/types/user';

interface RecipeFormProps {
  onRecipeGenerated: (recipe: Recipe) => void;
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
}

interface DietPreference {
  id: string;
  label: string;
}

// --- Constants ---
const dietaryOptions: DietPreference[] = [
  { id: 'vegan', label: 'Vegan' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'gluten-free', label: 'Gluten-Free' },
  { id: 'dairy-free', label: 'Dairy-Free' },
  { id: 'keto', label: 'Keto' },
  { id: 'paleo', label: 'Paleo' },
  { id: 'low-carb', label: 'Low-Carb' },
];

const mealTypes = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Dessert',
  'Snack',
  'Appetizer',
  'Soup',
  'Salad',
  'Main Course',
  'Side Dish',
];

const cuisines = [
  'Italian',
  'Mexican',
  'Chinese',
  'Indian',
  'Japanese',
  'Thai',
  'French',
  'Mediterranean',
  'American',
  'Middle Eastern',
  'Korean',
  'Vietnamese',
  'Greek',
  'Spanish',
  'Any',
];

const cookingTimes = [
  '15 minutes or less',
  '30 minutes or less',
  '1 hour or less',
  'More than 1 hour',
  'Any',
];

const skillLevels = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Any',
];

const nutritionalOptions = [
  { id: 'highProtein', label: 'High Protein' },
  { id: 'lowCalorie', label: 'Low Calorie (<500 cal)' },
  { id: 'lowCarb', label: 'Low Carb' },
  { id: 'highFiber', label: 'High Fiber' },
  { id: 'lowSodium', label: 'Low Sodium' },
  { id: 'custom', label: 'Custom Goal' }
];

const RecipeForm: React.FC<RecipeFormProps> = ({
  onRecipeGenerated,
  isGenerating,
  setIsGenerating
}) => {
  const [ingredients, setIngredients] = useState('');
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [cuisineStyle, setCuisineStyle] = useState('');
  const [mealType, setMealType] = useState('');
  const [cookingTime, setCookingTime] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [nutritionalGoal, setNutritionalGoal] = useState('');
  const [customNutritionalGoal, setCustomNutritionalGoal] = useState('');
  const [servings, setServings] = useState('4'); // Default servings
  const { toast } = useToast();

  // Load user preferences and potentially saved ingredients
  useEffect(() => {
    let ingredientsLoadedFromProfile = false; // Flag to track if profile ingredients were loaded

    // Load user preferences from profile document
    getUserProfile().then((profileDoc) => {
      if (profileDoc) {
        // Load Preferences
        if (profileDoc.dietaryPreferences && profileDoc.dietaryPreferences.length > 0) {
          setDietaryPreferences(profileDoc.dietaryPreferences);
        }
        if (profileDoc.cuisinePreferences && profileDoc.cuisinePreferences.length > 0) {
          setCuisineStyle(profileDoc.cuisinePreferences[0]);
        }
        if (profileDoc.skillLevel) {
          setSkillLevel(profileDoc.skillLevel);
        }
        if (profileDoc.defaultServings !== undefined && profileDoc.defaultServings > 0) {
          setServings(profileDoc.defaultServings.toString());
        }

        // --- Load Saved Ingredients from Profile ---
        if (profileDoc.savedIngredients && profileDoc.savedIngredients.length > 0) {
          setIngredients(profileDoc.savedIngredients.join(', '));
          ingredientsLoadedFromProfile = true; // Mark as loaded
          console.log("Loaded ingredients from user profile:", profileDoc.savedIngredients);
          // Optional: Toast notification for profile ingredients
          // toast({
          //   title: "Ingredients Loaded",
          //   description: `${profileDoc.savedIngredients.length} ingredients loaded from your profile.`,
          // });
        }
        // --- End Load Saved Ingredients ---
      }

      // --- Load from localStorage ONLY if not loaded from profile ---
      if (!ingredientsLoadedFromProfile) {
        const savedIngredientsLocal = localStorage.getItem('savedIngredients');
        if (savedIngredientsLocal) {
          try {
            const parsedIngredients = JSON.parse(savedIngredientsLocal);
            if (Array.isArray(parsedIngredients) && parsedIngredients.length > 0) {
              setIngredients(parsedIngredients.join(', '));
              localStorage.removeItem('savedIngredients'); // Clear after loading
              console.log("Loaded ingredients from localStorage (fallback):", parsedIngredients);
              toast({
                title: "Ingredients Loaded",
                description: `${parsedIngredients.length} ingredients loaded from your previous entry.`,
              });
            }
          } catch (err) {
            console.error('Error parsing saved ingredients from localStorage:', err);
            localStorage.removeItem('savedIngredients'); // Clear invalid data
          }
        }
      }
      // --- End Load from localStorage ---

    }).catch(err => {
      console.error('Error loading user profile:', err);
      // Don't show toast for profile load error, might be normal if not logged in
    }).finally(() => {
      setLoadingPreferences(false); // Finish loading state
    });

  }, [toast]); // Dependency array

  const handleDietaryChange = (value: string) => {
    setDietaryPreferences(prev => {
      if (prev.includes(value)) {
        return prev.filter(item => item !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  const handleClearAllIngredients = () => {
    setIngredients('');
  };

  const handleNutritionalGoalChange = (value: string) => {
    setNutritionalGoal(value);
    if (value !== 'custom') {
      setCustomNutritionalGoal('');
    }
  };

  const getFormattedNutritionalGoal = () => {
    if (nutritionalGoal === 'custom' && customNutritionalGoal) {
      return customNutritionalGoal;
    } else if (nutritionalGoal && nutritionalGoal !== 'custom') {
      const selectedOption = nutritionalOptions.find(option => option.id === nutritionalGoal);
      return selectedOption ? selectedOption.label : '';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredients.trim()) {
      setError('Please enter at least some ingredients');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const recipe = await generateRecipe(
        ingredients,
        dietaryPreferences,
        cuisineStyle,
        mealType,
        cookingTime,
        skillLevel,
        `${servings} servings`,
        undefined, // equipment
        getFormattedNutritionalGoal() // nutritional goals
      );
      onRecipeGenerated(recipe);
    } catch (err) {
      console.error('Error generating recipe:', err);
      const message = err instanceof Error && err.message ? err.message : 'Failed to generate recipe. Please try again later.';
      setError(message);
      toast({
        title: 'Recipe generation failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (loadingPreferences) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-md border-recipe-primary/20">
        <CardContent className="pt-6 space-y-4">
          <Skeleton className="h-8 w-[150px] mb-2" />
          <Skeleton className="h-[100px] w-full" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-md border-recipe-primary/20">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ingredients" className="text-lg font-medium">
                    Ingredients
                  </Label>
                  {ingredients && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAllIngredients}
                      className="h-8 px-2 text-gray-500"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>

                <Textarea
                  id="ingredients"
                  placeholder="Enter the ingredients you have (e.g., chicken, rice, tomatoes, etc.)"
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  className="min-h-[100px]"
                  required
                />

                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Separate with commas or new lines</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/ingredients'}
                    className="h-8 text-xs"
                  >
                    Use Speech Input
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-lg font-medium">Dietary Preferences</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {dietaryOptions.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.id}
                        checked={dietaryPreferences.includes(option.id)}
                        onCheckedChange={() => handleDietaryChange(option.id)}
                      />
                      <label htmlFor={option.id} className="text-sm">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cuisine" className="text-lg font-medium">
                    Cuisine Style
                  </Label>
                  <select
                    id="cuisine"
                    value={cuisineStyle}
                    onChange={(e) => setCuisineStyle(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md shadow-sm p-2"
                  >
                    <option value="">Select cuisine (optional)</option>
                    {cuisines.map((cuisine) => (
                      <option key={cuisine} value={cuisine}>
                        {cuisine}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mealType" className="text-lg font-medium">
                    Meal Type
                  </Label>
                  <select
                    id="mealType"
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md shadow-sm p-2"
                  >
                    <option value="">Select meal type (optional)</option>
                    {mealTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="nutrition" className="space-y-4">
              <div className="space-y-3">
                <Label className="text-lg font-medium">Nutritional Goals</Label>
                <RadioGroup value={nutritionalGoal} onValueChange={handleNutritionalGoalChange} className="space-y-2">
                  {nutritionalOptions.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.id} id={`nutrition-${option.id}`} />
                      <Label htmlFor={`nutrition-${option.id}`} className="text-sm font-normal">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {nutritionalGoal === 'custom' && (
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="customNutritional" className="text-sm">
                      Custom Nutritional Goal
                    </Label>
                    <Input
                      id="customNutritional"
                      placeholder="e.g., Under 30g of carbs per serving"
                      value={customNutritionalGoal}
                      onChange={(e) => setCustomNutritionalGoal(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="servings" className="text-lg font-medium">
                  Number of Servings
                </Label>
                <Input
                  id="servings"
                  type="number"
                  min="1"
                  max="20"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  className="w-full"
                />
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cookingTime" className="text-lg font-medium">
                    Cooking Time
                  </Label>
                  <select
                    id="cookingTime"
                    value={cookingTime}
                    onChange={(e) => setCookingTime(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md shadow-sm p-2"
                  >
                    <option value="">Select cooking time (optional)</option>
                    {cookingTimes.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skillLevel" className="text-lg font-medium">
                    Skill Level
                  </Label>
                  <select
                    id="skillLevel"
                    value={skillLevel}
                    onChange={(e) => setSkillLevel(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md shadow-sm p-2"
                  >
                    <option value="">Select skill level (optional)</option>
                    {skillLevels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <Button
            type="submit"
            className="w-full bg-recipe-primary hover:bg-recipe-secondary disabled:bg-gray-300"
            disabled={isGenerating || !ingredients.trim()}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Recipe...
              </>
            ) : (
              <>
                <ChefHat className="mr-2 h-5 w-5" />
                Generate Recipe
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RecipeForm;