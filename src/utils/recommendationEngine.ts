/**
 * Singapore Activities Recommendation Engine
 * Evaluates candidates based on:
 * Location + Interests + Budget + Duration + Group Size + Weather + Accessibility + Vouchers + Data Confidence
 */

import { SINGAPORE_ACTIVITIES } from '../data/singaporeActivities';
import {
  Activity,
  ItineraryItem,
  LiveSingaporeConditions,
  RecommendedPlan,
  TravelSegment,
  UserPreferences,
} from '../types';
import { calculateDistanceKm, getGoogleMapsNavigationUrl } from './singaporeData';

interface ScoredActivity {
  activity: Activity;
  score: number;
  matchReasons: string[];
  distanceKm: number;
}

/**
 * Calculates a multidimensional match score (0 - 100) for a candidate activity
 */
export function scoreActivity(
  activity: Activity,
  prefs: UserPreferences,
  conditions: LiveSingaporeConditions
): ScoredActivity {
  let score = 0;
  const matchReasons: string[] = [];

  // 1. Distance & Location Fit (Weight: 20 pts)
  let distanceKm = 3.5;
  const originLat = prefs.destinationCoordinates?.lat || prefs.currentCoordinates?.lat || 1.2834;
  const originLng = prefs.destinationCoordinates?.lng || prefs.currentCoordinates?.lng || 103.8500;

  if (activity.coordinates) {
    distanceKm = calculateDistanceKm(originLat, originLng, activity.coordinates.lat, activity.coordinates.lng);
  }

  if (distanceKm <= 2.0) {
    score += 20;
    matchReasons.push(`Close to selected area (${distanceKm.toFixed(1)} km away)`);
  } else if (distanceKm <= 5.0) {
    score += 15;
    matchReasons.push(`Convenient transit distance (${distanceKm.toFixed(1)} km)`);
  } else if (distanceKm <= 10.0) {
    score += 10;
  } else {
    score += 5;
  }

  // 2. Interest Match (Weight: 25 pts)
  if (prefs.interests.length > 0) {
    const matchingInterests = activity.interests.filter((interest) =>
      prefs.interests.some((userInt) => userInt.toLowerCase().includes(interest.toLowerCase()) || interest.toLowerCase().includes(userInt.toLowerCase()))
    );

    if (matchingInterests.length >= 2) {
      score += 25;
      matchReasons.push(`Strong match for your interests: ${matchingInterests.slice(0, 2).join(', ')}`);
    } else if (matchingInterests.length === 1) {
      score += 18;
      matchReasons.push(`Matches your interest in ${matchingInterests[0]}`);
    } else {
      score += 5; // general fallback
    }
  } else {
    // No specific interests selected - balance evenly
    score += 18;
  }

  // 3. Budget Fit (Weight: 15 pts)
  const maxBudget = prefs.budgetPerPerson;
  if (activity.pricePerPerson === 0) {
    score += 15;
    matchReasons.push('Free admission');
  } else if (activity.pricePerPerson <= maxBudget) {
    score += 14;
    matchReasons.push(`Fits within your SGD $${maxBudget}/pax budget (Est. $${activity.pricePerPerson})`);
  } else if (activity.pricePerPerson <= maxBudget * 1.25) {
    score += 8;
  } else {
    score += 2;
  }

  // 4. Group Size Suitability (Weight: 10 pts)
  if (prefs.groupSize >= activity.minGroupSize && prefs.groupSize <= activity.maxGroupSize) {
    score += 10;
    if (prefs.groupSize > 4) {
      matchReasons.push(`Spacious venue suited for your group of ${prefs.groupSize}`);
    } else if (prefs.groupSize === 1) {
      matchReasons.push('Great for solo discovery');
    } else if (prefs.groupSize === 2) {
      matchReasons.push('Ideal pace for couples');
    }
  } else {
    score += 4;
  }

  // 5. Weather & Indoor/Outdoor Suitability (Weight: 12 pts)
  const isRaining =
    conditions.weatherForecast.toLowerCase().includes('shower') ||
    conditions.weatherForecast.toLowerCase().includes('rain') ||
    conditions.weatherForecast.toLowerCase().includes('thundery') ||
    conditions.rainfallMm > 1.0;

  if (prefs.indoorOutdoor === 'indoor' || (prefs.indoorOutdoor === 'rain_preference' && isRaining)) {
    if (activity.indoorOutdoor === 'indoor') {
      score += 12;
      matchReasons.push('Fully air-conditioned indoor shelter — optimal for current weather');
    } else if (activity.indoorOutdoor === 'sheltered_outdoor') {
      score += 8;
      matchReasons.push('Sheltered walkways and covered pavilions');
    } else {
      score += 2;
    }
  } else if (prefs.indoorOutdoor === 'outdoor') {
    if (activity.indoorOutdoor === 'outdoor') {
      score += 12;
      matchReasons.push('Outdoor open-air setting');
    } else if (activity.indoorOutdoor === 'sheltered_outdoor') {
      score += 10;
    } else {
      score += 5;
    }
  } else {
    // Either
    if (isRaining && activity.indoorOutdoor === 'indoor') {
      score += 12;
      matchReasons.push('Indoor setting protects against current rain forecast');
    } else {
      score += 10;
    }
  }

  // 6. Accessibility Match (Weight: 8 pts)
  if (prefs.accessibility.length > 0) {
    let accessPass = true;
    const matchedAccs: string[] = [];

    if (prefs.accessibility.includes('wheelchair') && activity.accessibility.wheelchair) {
      matchedAccs.push('Wheelchair accessible');
    }
    if (prefs.accessibility.includes('step_free') && activity.accessibility.stepFree) {
      matchedAccs.push('Step-free');
    }
    if (prefs.accessibility.includes('lift_access') && activity.accessibility.liftAccess) {
      matchedAccs.push('Lift access');
    }
    if (prefs.accessibility.includes('minimal_walking') && activity.accessibility.minimalWalking) {
      matchedAccs.push('Minimal walking');
    }
    if (prefs.accessibility.includes('elderly_friendly') && activity.accessibility.elderlyFriendly) {
      matchedAccs.push('Elderly friendly');
    }
    if (prefs.accessibility.includes('children_friendly') && activity.accessibility.childrenFriendly) {
      matchedAccs.push('Kids friendly');
    }

    if (matchedAccs.length > 0) {
      score += 8;
      matchReasons.push(`Accessibility verified: ${matchedAccs.join(', ')}`);
    } else {
      score += 2;
      accessPass = false;
    }
  } else {
    score += 8;
  }

  // 7. Voucher Compatibility (Weight: 5 pts)
  if (prefs.vouchers.length > 0) {
    if (prefs.vouchers.includes('culture_pass') && activity.voucherSupport.culturePass) {
      score += 5;
      matchReasons.push('Eligible for Singapore Culture Pass');
    } else if (prefs.vouchers.includes('cdc_vouchers') && activity.voucherSupport.cdcVouchers) {
      score += 5;
      matchReasons.push('Accepts CDC Vouchers');
    } else if (prefs.vouchers.includes('activesg_credits') && activity.voucherSupport.activeSg) {
      score += 5;
      matchReasons.push('Accepts ActiveSG $100 credits');
    } else if (prefs.vouchers.includes('passion_card') && activity.voucherSupport.passionCard) {
      score += 4;
      matchReasons.push('Passion Card member privileges');
    }
  }

  // 8. Data Confidence & Community (Weight: 5 pts)
  if (activity.dataConfidence === 'VERIFIED') {
    score += 3;
  }
  if (activity.communityRating >= 4.7) {
    score += 2;
    matchReasons.push(`Highly rated by community (${activity.communityRating.toFixed(1)} ★)`);
  }

  return {
    activity,
    score: Math.min(100, Math.round(score)),
    matchReasons: matchReasons.slice(0, 5),
    distanceKm,
  };
}

/**
 * Builds a full, cohesive multi-stop itinerary plan from ranked candidates
 */
export function buildRecommendedPlan(
  prefs: UserPreferences,
  conditions: LiveSingaporeConditions,
  allActivities: Activity[] = SINGAPORE_ACTIVITIES
): { primaryPlan: RecommendedPlan; alternativePlans: RecommendedPlan[] } {
  // Score all activities
  const scored = allActivities
    .map((act) => scoreActivity(act, prefs, conditions))
    .sort((a, b) => b.score - a.score);

  const topCandidate = scored[0]?.activity || SINGAPORE_ACTIVITIES[0];
  const targetDuration = prefs.durationMinutes || 180;

  // Find complementary activities in same or adjacent area (e.g. Food + Culture)
  const nearbyCandidates = allActivities.filter((act) => act.id !== topCandidate.id);

  // Pick complementary food stop
  const foodCandidate =
    nearbyCandidates.find((act) => act.category === 'Food & Dining' && (act.area === topCandidate.area || calculateDistanceKm(topCandidate.coordinates.lat, topCandidate.coordinates.lng, act.coordinates.lat, act.coordinates.lng) <= 3)) ||
    allActivities.find((act) => act.category === 'Food & Dining') ||
    SINGAPORE_ACTIVITIES[1];

  // Pick complementary leisure/culture stop
  const leisureCandidate =
    nearbyCandidates.find((act) => act.id !== foodCandidate.id && (act.area === topCandidate.area || calculateDistanceKm(topCandidate.coordinates.lat, topCandidate.coordinates.lng, act.coordinates.lat, act.coordinates.lng) <= 4)) ||
    allActivities.find((act) => act.id !== topCandidate.id && act.id !== foodCandidate.id) ||
    SINGAPORE_ACTIVITIES[2];

  // Construct Time Slots
  const items: ItineraryItem[] = [];
  let currentCost = 0;
  let foodCost = 0;
  let activityCost = 0;
  const transportCost = 3.5; // Average Singapore MRT / Bus roundtrip cost per pax

  // Slot 1: Primary Activity
  items.push({
    timeSlot: '1:00 PM – 2:30 PM',
    activity: topCandidate,
    role: 'main',
    estimatedCost: topCandidate.pricePerPerson,
    customNotes: `Start at ${topCandidate.name}. ${topCandidate.tips[0] || ''}`,
  });
  activityCost += topCandidate.pricePerPerson;

  // Slot 2: Food Experience
  if (targetDuration >= 120) {
    items.push({
      timeSlot: '2:45 PM – 3:45 PM',
      activity: foodCandidate,
      role: 'food',
      estimatedCost: foodCandidate.pricePerPerson,
      customNotes: `Refuel with authentic local delicacies. ${foodCandidate.tips[0] || ''}`,
    });
    foodCost += foodCandidate.pricePerPerson;
  }

  // Slot 3: Relax / Secondary Discovery (for 3h+ duration)
  if (targetDuration >= 180 && leisureCandidate) {
    items.push({
      timeSlot: '4:00 PM – 5:15 PM',
      activity: leisureCandidate,
      role: 'relax',
      estimatedCost: leisureCandidate.pricePerPerson,
      customNotes: `Conclude with scenic relaxation. ${leisureCandidate.tips[0] || ''}`,
    });
    activityCost += leisureCandidate.pricePerPerson;
  }

  const costPerPerson = Math.round(activityCost + foodCost + transportCost);
  const totalCostGroup = costPerPerson * prefs.groupSize;

  // Generate Travel Segments
  const travelSegments: TravelSegment[] = [];
  const startLat = prefs.currentCoordinates?.lat || topCandidate.coordinates.lat;
  const startLng = prefs.currentCoordinates?.lng || topCandidate.coordinates.lng;

  travelSegments.push({
    fromName: prefs.currentLocationName || 'Current Location',
    toName: topCandidate.locationName,
    mode: 'mrt',
    durationMinutes: Math.min(25, Math.max(8, Math.round(scored[0]?.distanceKm * 4) || 12)),
    distanceMeters: Math.round((scored[0]?.distanceKm || 2.5) * 1000),
    instruction: `Take MRT to ${topCandidate.nearestMrt.station} (${topCandidate.nearestMrt.line.join('/')}), take ${topCandidate.nearestMrt.exit || 'main exit'}, then walk ${topCandidate.nearestMrt.walkMinutes} mins.`,
    mrtLines: topCandidate.nearestMrt.line,
    googleMapsUrl: getGoogleMapsNavigationUrl(topCandidate.name, topCandidate.coordinates.lat, topCandidate.coordinates.lng, startLat, startLng),
  });

  if (items.length > 1) {
    const distBetween = calculateDistanceKm(topCandidate.coordinates.lat, topCandidate.coordinates.lng, foodCandidate.coordinates.lat, foodCandidate.coordinates.lng);
    travelSegments.push({
      fromName: topCandidate.locationName,
      toName: foodCandidate.locationName,
      mode: distBetween < 1.0 ? 'walk' : 'mrt',
      durationMinutes: distBetween < 1.0 ? Math.round(distBetween * 12) + 4 : 12,
      distanceMeters: Math.round(distBetween * 1000),
      instruction: distBetween < 1.0 ? `Stroll ${Math.round(distBetween * 1000)}m via sheltered pedestrian walkways.` : `Quick hop on MRT to ${foodCandidate.nearestMrt.station}.`,
      googleMapsUrl: getGoogleMapsNavigationUrl(foodCandidate.name, foodCandidate.coordinates.lat, foodCandidate.coordinates.lng, topCandidate.coordinates.lat, topCandidate.coordinates.lng),
    });
  }

  // Smart Attire Advice
  let attireAdvice = 'Light, breathable clothing with comfortable walking shoes.';
  if (topCandidate.indoorOutdoor === 'indoor') {
    attireAdvice = 'Comfortable casual attire with a light cardigan or layer (indoor venues are air-conditioned at ~23°C - 25°C).';
  } else if (topCandidate.category === 'Sports & Active') {
    attireAdvice = 'Moisture-wicking sportswear and supportive running/sports trainers.';
  } else if (conditions.weatherForecast.toLowerCase().includes('rain') || conditions.rainfallMm > 0) {
    attireAdvice = 'Breathable attire with an umbrella or compact raincoat and water-resistant walking shoes.';
  }

  // Rain Backup Plan
  const rainAlt = allActivities.find((act) => act.id === topCandidate.rainAlternativeActivityId && act.id !== topCandidate.id) ||
    allActivities.find((act) => act.indoorOutdoor === 'indoor' && act.area === topCandidate.area) ||
    SINGAPORE_ACTIVITIES[0]; // National Museum default

  // Primary Plan object
  const primaryPlan: RecommendedPlan = {
    id: `plan-${Date.now()}`,
    title: `${topCandidate.area} Discovery & ${foodCandidate.category === 'Food & Dining' ? 'Culinary' : 'Culture'} Experience`,
    tagline: `Curated for ${prefs.groupSize} ${prefs.groupSize === 1 ? 'person' : 'people'} · ~${Math.round(targetDuration / 60)} hours · SGD ~$${costPerPerson}/pax`,
    area: topCandidate.area,
    totalDurationMinutes: targetDuration,
    costPerPerson,
    totalCostGroup,
    costBreakdown: {
      activity: activityCost,
      food: foodCost,
      transport: transportCost,
    },
    items,
    travelSegments,
    whyRecommended: scored[0]?.matchReasons || [
      'Optimal location and transit connection',
      'Fits your budget comfortably',
      'Matches your available duration',
    ],
    weatherSuitability: {
      status: topCandidate.indoorOutdoor === 'indoor' ? 'indoor_safe' : conditions.rainfallMm > 0 ? 'moderate' : 'optimal',
      summary: topCandidate.indoorOutdoor === 'indoor'
        ? `100% sheltered & air-conditioned — impervious to tropical downpours (${conditions.temperatureC}°C, ${conditions.weatherForecast}).`
        : `Outdoor activity — currently ${conditions.weatherForecast}. Check rain radar before heading out.`,
    },
    attireAdvice,
    rainPlan: {
      title: `Indoor Wet-Weather Alternative: ${rainAlt.name}`,
      description: `If tropical showers pick up, seamlessly pivot to ${rainAlt.name} in ${rainAlt.area}. It features 100% sheltered indoor exhibits and direct underground MRT connection.`,
      alternativeActivities: [rainAlt],
    },
    thingsToNote: [
      topCandidate.tips[0] || 'Check entry requirements.',
      topCandidate.voucherSupport.cdcVouchers ? 'CDC Vouchers accepted at food stops.' : 'Bring Singpass for free museum access where applicable.',
      `Nearest MRT: ${topCandidate.nearestMrt.station} (${topCandidate.nearestMrt.exit || 'Main Exit'}).`,
    ],
    similarityScore: 96,
  };

  // Alternative Plans (2-3 distinct trade-offs)
  const altCandidates = scored.slice(1, 4).map((s) => s.activity);
  const alternativePlans: RecommendedPlan[] = altCandidates.map((altAct, idx) => {
    const altFood = SINGAPORE_ACTIVITIES.find((a) => a.category === 'Food & Dining' && a.id !== altAct.id) || SINGAPORE_ACTIVITIES[1];
    const altCost = altAct.pricePerPerson + altFood.pricePerPerson + 3.5;

    return {
      id: `alt-plan-${idx}-${Date.now()}`,
      title: `${altAct.name} & ${altAct.area} Trail`,
      tagline: `Alternative: ${altAct.category} focus · ~$${Math.round(altCost)}/pax`,
      area: altAct.area,
      totalDurationMinutes: targetDuration,
      costPerPerson: Math.round(altCost),
      totalCostGroup: Math.round(altCost * prefs.groupSize),
      costBreakdown: {
        activity: altAct.pricePerPerson,
        food: altFood.pricePerPerson,
        transport: 3.5,
      },
      items: [
        {
          timeSlot: '1:00 PM – 2:45 PM',
          activity: altAct,
          role: 'main',
          estimatedCost: altAct.pricePerPerson,
          customNotes: altAct.description,
        },
        {
          timeSlot: '3:00 PM – 4:00 PM',
          activity: altFood,
          role: 'food',
          estimatedCost: altFood.pricePerPerson,
          customNotes: `Local meal stop at ${altFood.name}.`,
        },
      ],
      travelSegments: [
        {
          fromName: prefs.currentLocationName || 'Origin',
          toName: altAct.locationName,
          mode: 'mrt',
          durationMinutes: 15,
          distanceMeters: 3200,
          instruction: `MRT to ${altAct.nearestMrt.station} (${altAct.nearestMrt.line.join('/')}).`,
          googleMapsUrl: getGoogleMapsNavigationUrl(altAct.name, altAct.coordinates.lat, altAct.coordinates.lng),
        },
      ],
      whyRecommended: [
        `Focuses on ${altAct.category}`,
        `Located in ${altAct.area}`,
        altAct.indoorOutdoor === 'indoor' ? 'Fully air-conditioned indoor experience' : 'Great outdoor atmosphere',
      ],
      weatherSuitability: {
        status: altAct.indoorOutdoor === 'indoor' ? 'indoor_safe' : 'moderate',
        summary: altAct.indoorOutdoor === 'indoor' ? 'Air-conditioned comfort' : `Current conditions: ${conditions.weatherForecast}`,
      },
      attireAdvice: altAct.indoorOutdoor === 'indoor' ? 'Smart casual with light layer.' : 'Casual breathable wear.',
      rainPlan: {
        title: `Wet-Weather Pivot`,
        description: `Shelter at ${altAct.nearestMrt.station} mall corridor.`,
        alternativeActivities: [SINGAPORE_ACTIVITIES[0]],
      },
      thingsToNote: [altAct.tips[0] || 'Check opening hours.', `Station: ${altAct.nearestMrt.station}`],
      similarityScore: 85 - idx * 6,
    };
  });

  return { primaryPlan, alternativePlans };
}
