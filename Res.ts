export interface PagedResponse<T> {
  count?: number;
  next?: string;
  previous?: string;
  results: T[];
}
export type FITNESS_LEVEL = "BEGINNER" | "INTERMEDIATE" | "PRO";
export type GENDER = "MALE" | "FEMALE";
export type GOAL =
  | "LOSE_WEIGHT"
  | "BUILD_MUSCLE"
  | "FLEXIBILITY"
  | "WELLNESS"
  | "CARDIO";
export type WEIGHT_UNIT = "KG" | "LBS" | "LBS_STONE";
export type INGREDIENT_UNIT = "G" | "L";
export type HEIGHT_UNIT = "METRES" | "FT";

export interface Profile {
  avatar: string | null;
  date_of_birth: string | null;
  days_a_week_workout: number | null;
  first_name: string | null;
  fitness_level: FITNESS_LEVEL | null;
  gender: GENDER | null;
  goal: GOAL | null;
  height: number | null; // cm
  height_units: HEIGHT_UNIT | null;
  id: string;
  last_name: string | null;
  weight: number | null; // kg
  weight_units: WEIGHT_UNIT | null;
}
export interface ProfileSummary {
  id: string;
  avatar: string | null;
  first_name: string | null;
  last_name: string | null;
}
export interface WorkoutCategory {
  id: string;
  colour: string;
  name: string;
}
export interface ProgramCategory {
  id: string;
  colour: string;
  name: string;
}
export interface ProgramSummary {
  category: ProgramCategory;
  featured: boolean;
  id: string;
  image: string;
  is_test: boolean;
  name: string;
  published_date: string;
}
export interface WorkoutSummary {
  category: WorkoutCategory;
  exercise_count: number;
  estimated_duration: number;
  image: string;
  name: string;
}

export interface Equipment {
  id: string;
  image: string;
  name: string;
}

export interface Program {
  category: ProgramCategory;
  description: string;
  equipment: Equipment[];
  featured: boolean;
  id: string;
  image: string;
  is_test: boolean;
  length: number;
  name: string;
  published_date: string;
  workouts: (WorkoutSummary & { day: number })[];
}
export interface Exercise {
  id: string;
  name: string;
  image: string;
  sets: number | null;
  reps: number | null;
  duration: number | null;
  video: string;
}
export type PurchaseType = "PROGRAM";

export interface Purchase {
  id: string;
  qonversion_id: string;
  product_id: string;
  product_type: PurchaseType;
}

export type MuscleGroup = "ABS" | "CHEST" | "QUADS"; //todo

export interface Workout {
  id: string;
  featured: boolean;
  name: string;
  category: WorkoutCategory;
  exercises: Exercise[];
  muscle_groups: MuscleGroup[];
  equipment: Equipment[];
}
export interface AchievementCategory {
  id: string;
  colour: string;
  name: string;
}
export interface RecipeTag {
  id: string;
  colour: string;
  name: string;
}
export type AchievementDifficulty = "EASY" | "MEDIUM" | "HARD";
export interface Achievement {
  id: string;
  name: string;
  description: string;
  difficulty: AchievementDifficulty;
  category: AchievementCategory;
}
export interface WorkoutCount {
  completed: number;
  total: number;
  steak: number;
}
export interface UserExercise {
  id: string;
  /** * whether the user has completed that exercise */
  completed: boolean;
  skipped: boolean; // whether the user has completed that exercise
  excercise: Exercise;
  reps: number | null; // reps tracked (if applicable)
  weight: number | null; // weight tracked (if applicable)
}
export interface UserWorkout {
  id: string;
  workout: Workout;
  completed: boolean;
  user_exercises: UserExercise[];
  achievements: Achievement[];
}
export type Currency = "CAD" | "USD" | "EUR" | "GBP";
export interface ChargbeePlan {
  id: string;
  price_id: string;
  price: number;
  currency: Currency;
}

export interface RecipeSummary {
  id: string;
  name: string;
  category: RecipeCategory;
  tags: RecipeTag[];
  image: string;
}
export interface RecipeMethod {
  title: string;
  description: string;
}
export interface RecipeIngredient {
  name: string;
  value: number;
  unit: WEIGHT_UNIT | null;
  custom_unit: string | null;
}
export interface Recipe {
  id: string;
  name: string;
  category: RecipeCategory;
  tags: RecipeTag[];
  image: string;
  method: RecipeMethod[];
  ingredients: RecipeIngredient[];
  calories: number;
  proteins: number;
  sugar: number;
  fats: number;
}

export interface RecipeCategory {
  name: string;
  id: string;
}

export interface DiscussionSummary {
  title: string;
  images: string;
  content: string;
  created_at: string;
  id: string;
  like_count: number;
  comment_count: number;
  author: ProfileSummary;
  category: DiscussionCategory;
}

export interface Comment {
  author: ProfileSummary;
  tagged_user?: ProfileSummary;
  images: string;
  message: string;
  like_count: number;
}

export interface DiscussionCategory {
  name: string;
  icon: string;
  id: string;
}

export enum Mood {
  "VERY_UNHAPPY",
  "UNHAPPY",
  "NEUTRAL",
  "HAPPY",
  "VERY_HAPPY",
}

export interface Progress {
  id: string;
  image: string;
  mood: Mood;
  weight: number | null;
}
export type EndProgress = Progress & { start_id: string | null };

export interface Notification {
  read: boolean;
  url: string;
  title: string;
  text: string;
}

export type ScheduleStatus = "COMPLETED" | "SKIPPED" | "UPCOMING";

export interface ScheduleSummary {
  date: string;
  status: ScheduleStatus;
  menstrual: boolean | null;
  workout_id: string | null;
}

export interface ScheduleDay {
  date: string;
  status: ScheduleStatus;
  menstrual: boolean | null;
  workout: WorkoutSummary;
}
export interface PaymentData {
  //ignore for now, needed for stripe
  clientSecret: string;
  customerId: string;
  customerEphemeralKey: string;
}
export interface MenstrualHealth {
  cycle_length: number;
  start_date: string;
}
export interface DailyInspiration {
  image: string;
  content: string;
}

export interface WaterTracker {
  id: string;
  date: string;
  value: number;
}

export interface MenstrualHealthConflicts {
  days: string;
}
export interface NotificationsCounts {
  count: number;
}
export interface DiscussionComment {
  id: string;
}

export interface ChargebeeHostedPages {
  url: string;
}

export type Res = {
  workouts: WorkoutSummary[];
  recipes: RecipeSummary[];
  discussions: PagedResponse<DiscussionSummary>;
  discussionComments: PagedResponse<Comment>;
  notifications: PagedResponse<Notification>;
};

// END OF TYPES
