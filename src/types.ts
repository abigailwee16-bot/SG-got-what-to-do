/**
 * SG Activities - Core Type Definitions
 * Typed models for Singapore activities discovery and recommendation engine
 */

export type DataConfidence = 'VERIFIED' | 'LIVE' | 'ESTIMATED' | 'COMMUNITY' | 'UNVERIFIED';

export type IndoorOutdoorPreference = 'indoor' | 'outdoor' | 'either' | 'rain_preference';

export type GroupSizeCategory = '1' | '2' | '3-4' | '5-8' | '9-15' | '16+';

export type DurationOption = 'under_1h' | '1_2h' | '2_3h' | '3_5h' | 'half_day' | 'full_day';

export type BudgetRange = 'free' | 'under_10' | '10_25' | '25_50' | '50_100' | '100_plus';

export type AccessibilityRequirement =
  | 'wheelchair'
  | 'step_free'
  | 'lift_access'
  | 'minimal_walking'
  | 'accessible_toilets'
  | 'elderly_friendly'
  | 'children_friendly';

export type VoucherType =
  | 'culture_pass'
  | 'cdc_vouchers'
  | 'activesg_credits'
  | 'passion_card';

export type ActivityCategory =
  | 'Food & Dining'
  | 'Heritage & History'
  | 'Museums & Exhibitions'
  | 'Arts & Theatre'
  | 'Nature & Parks'
  | 'Sports & Active'
  | 'Shopping & Retail'
  | 'Family & Kids'
  | 'Workshops & Cooking'
  | 'Nightlife & Entertainment'
  | 'Wellness & Relaxation'
  | 'Sightseeing & Landmarks'
  | 'Learning & Science';

export interface Activity {
  id: string;
  name: string;
  category: ActivityCategory;
  interests: string[];
  locationName: string;
  area: string; // e.g., 'Chinatown', 'Marina Bay', 'Orchard', 'Bugis', 'Tiong Bahru', 'Sentosa', 'Civic District'
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
  postalCode?: string;
  nearestMrt: {
    station: string;
    line: string[]; // e.g. ['DT', 'NE']
    exit?: string;
    walkMinutes: number;
  };
  pricePerPerson: number; // in SGD (0 = free)
  priceType: 'exact' | 'estimated' | 'free';
  durationMinutes: number;
  minGroupSize: number;
  maxGroupSize: number;
  indoorOutdoor: 'indoor' | 'outdoor' | 'sheltered_outdoor';
  airConditioned: boolean;
  accessibility: {
    wheelchair: boolean;
    stepFree: boolean;
    liftAccess: boolean;
    minimalWalking: boolean;
    accessibleToilets: boolean;
    elderlyFriendly: boolean;
    childrenFriendly: boolean;
    notes?: string;
  };
  voucherSupport: {
    culturePass: boolean;
    cdcVouchers: boolean;
    activeSg: boolean;
    passionCard: boolean;
    notes?: string;
  };
  openingHours: string;
  isVerifiedOpenNow?: boolean;
  source: string;
  sourceUrl?: string;
  sourceType: 'official_venue' | 'gov_agency' | 'nhb' | 'activesg' | 'singapore_tourism' | 'community';
  verifiedAt: string;
  dataConfidence: DataConfidence;
  communityRating: number; // 1.0 - 5.0
  reviewCount: number;
  tips: string[];
  description: string;
  highlights: string[];
  rainAlternativeActivityId?: string;
  attireTag: 'casual' | 'sportswear' | 'breathable_outdoor' | 'smart_casual' | 'light_jacket_recommended';
}

export interface UserPreferences {
  currentLocationName: string;
  currentCoordinates?: {
    lat: number;
    lng: number;
  };
  destinationQuery?: string;
  destinationCoordinates?: {
    lat: number;
    lng: number;
  };
  groupSize: number;
  groupCategory: GroupSizeCategory;
  durationMinutes: number;
  durationOption: DurationOption;
  budgetPerPerson: number;
  budgetOption: BudgetRange;
  indoorOutdoor: IndoorOutdoorPreference;
  accessibility: AccessibilityRequirement[];
  vouchers: VoucherType[];
  interests: string[];
}

export interface ItineraryItem {
  timeSlot: string; // e.g., "1:00 PM - 2:15 PM"
  activity: Activity;
  role: 'start' | 'main' | 'food' | 'culture' | 'relax' | 'alternative';
  customNotes?: string;
  estimatedCost: number;
}

export interface TravelSegment {
  fromName: string;
  toName: string;
  mode: 'walk' | 'mrt' | 'bus' | 'taxi';
  durationMinutes: number;
  distanceMeters: number;
  instruction: string;
  mrtLines?: string[];
  busServices?: string[];
  googleMapsUrl: string;
}

export interface RecommendedPlan {
  id: string;
  title: string;
  tagline: string;
  area: string;
  totalDurationMinutes: number;
  costPerPerson: number;
  totalCostGroup: number;
  costBreakdown: {
    activity: number;
    food: number;
    transport: number;
  };
  items: ItineraryItem[];
  travelSegments: TravelSegment[];
  whyRecommended: string[];
  weatherSuitability: {
    status: 'optimal' | 'moderate' | 'indoor_safe';
    summary: string;
  };
  attireAdvice: string;
  rainPlan: {
    title: string;
    description: string;
    alternativeActivities: Activity[];
  };
  thingsToNote: string[];
  geminiInsight?: {
    narrative: string;
    localInsiderTip: string;
    tradeOffs: string;
    generatedAt: string;
  };
  similarityScore?: number;
  matchReasons?: string[];
}

export interface LiveSingaporeConditions {
  weatherForecast: string; // e.g. "Passing Showers", "Fair (Day)", "Cloudy"
  temperatureC: number;
  humidityPercent: number;
  rainfallMm: number;
  psiValue: number;
  psiStatus: 'Good' | 'Moderate' | 'Unhealthy';
  forecast2hr: {
    area: string;
    forecast: string;
  }[];
  lastUpdated: string;
  dataConfidence: DataConfidence;
  source: string;
}

export interface CommunityTip {
  id: string;
  activityId?: string;
  activityName: string;
  area: string;
  authorName: string;
  category: 'crowd' | 'transport' | 'voucher' | 'food' | 'general';
  content: string;
  helpfulCount: number;
  createdAt: string;
  dataConfidence: 'COMMUNITY';
}

export interface CommunityPlan {
  id: string;
  title: string;
  creatorName: string;
  area: string;
  groupSize: number;
  durationMinutes: number;
  budgetPerPerson: number;
  indoorOutdoor: 'indoor' | 'outdoor' | 'mixed';
  interests: string[];
  activities: string[];
  description: string;
  likesCount: number;
  tips: string[];
  similarityScore?: number;
  similarityHighlights?: string[];
}
