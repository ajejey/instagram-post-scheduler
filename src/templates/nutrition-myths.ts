/**
 * Template for nutrition myths carousel post
 * This provides the content structure for a nutrition myths post
 */
export const getNutritionMythsContent = (): {
  title: string;
  slides: string[];
  cta: string;
  caption: string;
} => {
  const hashtags = "#nutrition #healthyeating #nutritionmyths #dietmyths #healthtips #weightloss #healthyliving #wellness #nutritioncoach #dietitian #nutritionist #healthyfood #healthylifestyle #nutritionfacts #foodfacts #healthyhabits #balanceddiet #eatinghealthy #nutritiontips #foodscience";
  
  return {
    title: "🧠 10 Nutrition Myths You Still Believe",
    slides: [
      "Myth 1: Carbs make you fat.",
      "Myth 2: Eating after 8 PM causes weight gain.",
      "Myth 3: Fat-free means healthy.",
      "Myth 4: Detox diets cleanse your body.",
      "Myth 5: High-protein diets harm your kidneys.",
      "Myth 6: Snacking leads to weight gain.",
      "Myth 7: All calories are equal."
    ],
    cta: "Track your nutrition accurately with DailyNutritionTracker.com",
    caption: `🧠 DEBUNKING 10 COMMON NUTRITION MYTHS 🧠

These nutrition myths might be sabotaging your health goals:

1️⃣ Carbs don't make you fat - excess calories do
2️⃣ Eating after 8 PM doesn't cause weight gain - total daily calories matter
3️⃣ Fat-free isn't healthy - many contain added sugars
4️⃣ Detox diets don't work - your liver and kidneys do that naturally
5️⃣ High-protein diets are safe for healthy people
6️⃣ Healthy snacking prevents overeating
7️⃣ Not all calories are equal - quality matters

Want to track your nutrition accurately? Visit DailyNutritionTracker.com

${hashtags}`
  };
};
