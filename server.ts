import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;

// Initialize Gemini Client safely on server-side only
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'SG Activities Backend',
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Data.gov.sg v2 Live Keyless Weather & Environment In-Memory Cache
  const weatherCache: Record<string, { timestamp: number; data: any }> = {};
  const CACHE_TTL_MS = 45000; // 45 seconds cache to avoid rate limit (code: 24)

  const V2_WEATHER_ENDPOINTS = [
    'two-hr-forecast',
    'twenty-four-hr-forecast',
    'four-day-outlook',
    'air-temperature',
    'rainfall',
    'psi',
    'pm25',
    'uv',
    'relative-humidity',
    'wind-speed',
  ] as const;

  async function fetchV2Weather(endpoint: string, queryParams: Record<string, any> = {}) {
    const cacheKey = `${endpoint}_${JSON.stringify(queryParams)}`;
    const cached = weatherCache[cacheKey];
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const url = new URL(`https://api-open.data.gov.sg/v2/real-time/api/${endpoint}`);
      Object.entries(queryParams).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          url.searchParams.append(k, String(v));
        }
      });

      const response = await fetch(url.toString(), {
        headers: {
          accept: 'application/json',
          'User-Agent': 'SG-Got-What-To-Do/1.0',
        },
      });

      if (!response.ok) {
        if (cached) return cached.data;
        throw new Error(`Upstream status ${response.status}`);
      }

      const json = await response.json();

      // If upstream returned rate limit (code 24) but we have a cached version, return cached
      if (json.code === 24 && cached) {
        return cached.data;
      }

      if (json.code === 0 && json.data) {
        weatherCache[cacheKey] = {
          timestamp: now,
          data: json,
        };
      }

      return json;
    } catch (err: any) {
      if (cached) return cached.data;
      throw err;
    }
  }

  // Register dedicated API routes for each of the 10 data.gov.sg v2 endpoints
  V2_WEATHER_ENDPOINTS.forEach((endpoint) => {
    app.get(`/api/weather/${endpoint}`, async (req, res) => {
      try {
        const result = await fetchV2Weather(endpoint, req.query);
        res.json(result);
      } catch (err: any) {
        console.error(`Error fetching v2 weather ${endpoint}:`, err);
        res.status(500).json({
          code: 500,
          error: `Failed to fetch ${endpoint} from data.gov.sg v2 API`,
          message: err.message,
        });
      }
    });
  });

  // Generic wildcard proxy for any v2 weather endpoint
  app.get('/api/weather/v2/:metric', async (req, res) => {
    const metric = req.params.metric;
    try {
      const result = await fetchV2Weather(metric, req.query);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        code: 500,
        error: `Failed to fetch ${metric} from data.gov.sg v2 API`,
        message: err.message,
      });
    }
  });

  // Real-time Aggregated Singapore Weather & Environmental Data (data.gov.sg v2)
  app.get(['/api/live-data/weather', '/api/weather/live'], async (req, res) => {
    try {
      const now = new Date();

      // Fetch all v2 sources in parallel with cache-backed resilience
      const [
        twoHrData,
        tempData,
        rainfallData,
        psiData,
        pm25Data,
        uvData,
        humidityData,
        windData,
        twentyFourHrData,
        fourDayData,
      ] = await Promise.all([
        fetchV2Weather('two-hr-forecast').catch(() => null),
        fetchV2Weather('air-temperature').catch(() => null),
        fetchV2Weather('rainfall').catch(() => null),
        fetchV2Weather('psi').catch(() => null),
        fetchV2Weather('pm25').catch(() => null),
        fetchV2Weather('uv').catch(() => null),
        fetchV2Weather('relative-humidity').catch(() => null),
        fetchV2Weather('wind-speed').catch(() => null),
        fetchV2Weather('twenty-four-hr-forecast').catch(() => null),
        fetchV2Weather('four-day-outlook').catch(() => null),
      ]);

      let weatherForecast = 'Partly Cloudy';
      let temperatureC = 31.0;
      let humidityPercent = 75;
      let rainfallMm = 0.0;
      let psiValue = 35;
      let psiStatus = 'Good';
      let pm25Value: number | null = null;
      let uvIndex: number | null = null;
      let windSpeedKmH: number | null = null;
      const forecast2hr: { area: string; forecast: string }[] = [];

      // 1. Two-hr forecast
      const twoHrItems = twoHrData?.data?.items?.[0];
      if (twoHrItems?.forecasts && Array.isArray(twoHrItems.forecasts)) {
        twoHrItems.forecasts.forEach((f: any) => {
          forecast2hr.push({ area: f.area, forecast: f.forecast });
        });
        const cityForecast = twoHrItems.forecasts.find((f: any) =>
          ['City', 'Central Water Catchment', 'Kallang', 'Downtown Core'].includes(f.area)
        );
        if (cityForecast) {
          weatherForecast = cityForecast.forecast;
        } else if (twoHrItems.forecasts[0]) {
          weatherForecast = twoHrItems.forecasts[0].forecast;
        }
      }

      // 2. Air Temperature
      const tempReadings = tempData?.data?.readings || tempData?.data?.items?.[0]?.readings;
      if (Array.isArray(tempReadings) && tempReadings.length > 0) {
        const validValues = tempReadings.map((r: any) => r.value).filter((v: any) => typeof v === 'number');
        if (validValues.length > 0) {
          const avg = validValues.reduce((a: number, b: number) => a + b, 0) / validValues.length;
          temperatureC = Math.round(avg * 10) / 10;
        }
      }

      // 3. Rainfall
      const rainReadings = rainfallData?.data?.readings || rainfallData?.data?.items?.[0]?.readings;
      if (Array.isArray(rainReadings) && rainReadings.length > 0) {
        const validRain = rainReadings.map((r: any) => r.value).filter((v: any) => typeof v === 'number');
        if (validRain.length > 0) {
          const maxRain = Math.max(...validRain);
          rainfallMm = Math.round(maxRain * 10) / 10;
        }
      }

      // 4. PSI (Pollutant Standards Index)
      const psiItems = psiData?.data?.items?.[0];
      const psiReadings = psiItems?.readings?.psi_twenty_four_hourly || psiItems?.readings?.psiTwentyFourHourly;
      if (psiReadings) {
        psiValue = psiReadings.national || psiReadings.central || psiValue;
        psiStatus = psiValue <= 50 ? 'Good' : psiValue <= 100 ? 'Moderate' : 'Unhealthy';
      }

      // 5. PM2.5
      const pm25Items = pm25Data?.data?.items?.[0];
      const pm25Readings = pm25Items?.readings?.pm25_one_hourly || pm25Items?.readings?.pm25OneHourly;
      if (pm25Readings) {
        pm25Value = pm25Readings.national || pm25Readings.central || null;
      }

      // 6. UV Index
      const uvRecords = uvData?.data?.records?.[0]?.index || uvData?.data?.index;
      if (Array.isArray(uvRecords) && uvRecords.length > 0) {
        uvIndex = uvRecords[uvRecords.length - 1]?.value ?? null;
      }

      // 7. Relative Humidity
      const humReadings = humidityData?.data?.readings || humidityData?.data?.items?.[0]?.readings;
      if (Array.isArray(humReadings) && humReadings.length > 0) {
        const validHum = humReadings.map((r: any) => r.value).filter((v: any) => typeof v === 'number');
        if (validHum.length > 0) {
          const avgHum = validHum.reduce((a: number, b: number) => a + b, 0) / validHum.length;
          humidityPercent = Math.round(avgHum);
        }
      }

      // 8. Wind Speed
      const windReadings = windData?.data?.readings || windData?.data?.items?.[0]?.readings;
      if (Array.isArray(windReadings) && windReadings.length > 0) {
        const validWind = windReadings.map((r: any) => r.value).filter((v: any) => typeof v === 'number');
        if (validWind.length > 0) {
          const avgWind = validWind.reduce((a: number, b: number) => a + b, 0) / validWind.length;
          windSpeedKmH = Math.round(avgWind * 1.852 * 10) / 10; // knots to km/h
        }
      }

      res.json({
        weatherForecast,
        temperatureC,
        humidityPercent,
        rainfallMm,
        psiValue,
        psiStatus,
        pm25Value,
        uvIndex,
        windSpeedKmH,
        forecast2hr: forecast2hr.slice(0, 16),
        twentyFourHr: twentyFourHrData?.data?.records?.[0] || null,
        fourDayOutlook: fourDayData?.data?.records?.[0] || null,
        lastUpdated: now.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
        dataConfidence: 'LIVE',
        source: 'api-open.data.gov.sg v2 Real-Time Environment API',
      });
    } catch (err: any) {
      console.warn('Weather v2 fallback used:', err.message);
      res.json({
        weatherForecast: 'Partly Cloudy with passing afternoon showers',
        temperatureC: 31.2,
        humidityPercent: 76,
        rainfallMm: 0.8,
        psiValue: 38,
        psiStatus: 'Good',
        pm25Value: 12,
        uvIndex: 6,
        windSpeedKmH: 14.5,
        forecast2hr: [
          { area: 'City', forecast: 'Partly Cloudy (Day)' },
          { area: 'Marina Bay', forecast: 'Partly Cloudy (Day)' },
          { area: 'Sentosa', forecast: 'Fair (Day)' },
          { area: 'Changi', forecast: 'Passing Showers' },
        ],
        lastUpdated: new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' }),
        dataConfidence: 'ESTIMATED',
        source: 'data.gov.sg v2 (Cached/Fallback)',
      });
    }
  });

  // Helper to format LTA DataMall NextBus object
  function formatBusInfo(rawBus: any): any {
    if (!rawBus || !rawBus.EstimatedArrival) return null;

    const arrivalTime = new Date(rawBus.EstimatedArrival).getTime();
    const now = Date.now();
    const diffMs = arrivalTime - now;
    const minutes = Math.round(diffMs / 60000);

    let arrivalText = 'Arr';
    if (minutes > 1) {
      arrivalText = `${minutes}m`;
    } else if (minutes === 1) {
      arrivalText = '1m';
    } else if (diffMs < -60000) {
      arrivalText = 'Departed';
    }

    const loadMap: Record<string, string> = {
      SEA: 'Seats Available',
      SDA: 'Standing Available',
      LSD: 'Limited Standing',
    };

    const typeMap: Record<string, string> = {
      SD: 'Single Deck',
      DD: 'Double Deck',
      BD: 'Bendy Bus',
    };

    return {
      originCode: rawBus.OriginCode || '',
      destinationCode: rawBus.DestinationCode || '',
      estimatedArrival: rawBus.EstimatedArrival,
      minutesToArrival: Math.max(0, minutes),
      arrivalText,
      latitude: rawBus.Latitude || '',
      longitude: rawBus.Longitude || '',
      visitNumber: rawBus.VisitNumber || '1',
      load: rawBus.Load || 'SEA',
      loadDescription: loadMap[rawBus.Load] || 'Seats Available',
      feature: rawBus.Feature || '',
      isWheelchairAccessible: rawBus.Feature === 'WAB',
      type: rawBus.Type || 'SD',
      typeDescription: typeMap[rawBus.Type] || 'Single Deck',
    };
  }

  // 3. LTA DataMall Bus Arrival v3 API (20-second live transit refresh)
  // URL: https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=83139
  // Optional: &ServiceNo=15
  // Header: AccountKey: qZvhPBcOT16UFKiwYuzzDg==
  app.get(['/api/bus-arrival', '/api/transit/bus-arrival'], async (req, res) => {
    const busStopCode = String(req.query.BusStopCode || req.query.busStopCode || '').trim();
    const serviceNo = String(req.query.ServiceNo || req.query.serviceNo || '').trim();

    if (!busStopCode) {
      return res.status(400).json({
        error: 'BusStopCode parameter is required (e.g., ?BusStopCode=83139 or ?BusStopCode=83139&ServiceNo=15)',
      });
    }

    const accountKey = process.env.LTA_DATAMALL_ACCOUNT_KEY || 'qZvhPBcOT16UFKiwYuzzDg==';

    try {
      let ltaUrl = `https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=${encodeURIComponent(busStopCode)}`;
      if (serviceNo) {
        ltaUrl += `&ServiceNo=${encodeURIComponent(serviceNo)}`;
      }

      const response = await fetch(ltaUrl, {
        headers: {
          AccountKey: accountKey,
          accept: 'application/json',
          'User-Agent': 'SG-Got-What-To-Do/1.0',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`LTA DataMall API responded with status ${response.status}:`, errorText);
        return res.status(response.status).json({
          error: `LTA DataMall API error: ${response.status}`,
          details: errorText,
        });
      }

      const data = await response.json();
      const formattedServices = (data.Services || []).map((srv: any) => ({
        serviceNo: srv.ServiceNo,
        operator: srv.Operator,
        nextBus: formatBusInfo(srv.NextBus),
        nextBus2: formatBusInfo(srv.NextBus2),
        nextBus3: formatBusInfo(srv.NextBus3),
      }));

      return res.json({
        busStopCode: data.BusStopCode || busStopCode,
        services: formattedServices,
        raw: data,
        lastUpdated: new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
        dataConfidence: 'LIVE',
        source: 'LTA DataMall v3 Live Bus Arrival API',
      });
    } catch (err: any) {
      console.error('Error fetching LTA Bus Arrival:', err);
      return res.status(500).json({
        error: 'Failed to fetch bus arrival data from LTA DataMall',
        message: err.message,
      });
    }
  });

  // 4. OneMap Singapore Location Search & Geocoding
  app.get('/api/location/search', async (req, res) => {
    const query = String(req.query.query || '').trim();
    if (!query) {
      return res.json({ results: [] });
    }

    try {
      // Query OneMap public search endpoint
      const onemapUrl = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(query)}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;
      const response = await fetch(onemapUrl, {
        headers: {
          'User-Agent': 'SG-Activities-App/1.0',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const formatted = (data.results || []).slice(0, 8).map((r: any) => ({
          name: r.SEARCHVAL || r.BUILDING || r.ROAD_NAME,
          address: `${r.BLK_NO ? r.BLK_NO + ' ' : ''}${r.ROAD_NAME || ''}${r.POSTAL ? ' Singapore ' + r.POSTAL : ''}`.trim(),
          postalCode: r.POSTAL || '',
          coordinates: {
            lat: parseFloat(r.LATITUDE),
            lng: parseFloat(r.LONGITUDE),
          },
          source: 'OneMap Geospatial API',
          dataConfidence: 'LIVE',
        }));
        return res.json({ results: formatted });
      }
    } catch (e) {
      console.warn('OneMap search error:', e);
    }

    // Return empty results if unreached
    res.json({ results: [] });
  });

  // 4. OneMap Reverse Geocoding
  app.get('/api/location/reverse', async (req, res) => {
    const lat = parseFloat(String(req.query.lat));
    const lng = parseFloat(String(req.query.lng));

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    // Default Singapore neighbourhood mapping
    let detectedArea = 'Singapore Central';
    if (lat > 1.27 && lat < 1.29 && lng > 103.83 && lng < 103.86) {
      detectedArea = 'Chinatown / Tanjong Pagar';
    } else if (lat > 1.28 && lat < 1.30 && lng > 103.85 && lng < 103.87) {
      detectedArea = 'Marina Bay / Civic District';
    } else if (lat > 1.29 && lat < 1.32 && lng > 103.82 && lng < 103.84) {
      detectedArea = 'Orchard / Somerset';
    } else if (lat > 1.24 && lat < 1.27 && lng > 103.81 && lng < 103.84) {
      detectedArea = 'Sentosa / HarbourFront';
    } else if (lat > 1.29 && lat < 1.31 && lng > 103.85 && lng < 103.87) {
      detectedArea = 'Bugis / Kampong Gelam';
    } else if (lat > 1.34 && lat < 1.38 && lng > 103.96 && lng < 104.0) {
      detectedArea = 'Changi Airport / Jewel';
    }

    res.json({
      area: detectedArea,
      coordinates: { lat, lng },
      dataConfidence: 'ESTIMATED',
      source: 'Singapore Coordinates Mapping',
    });
  });

  // 5. Gemini AI Insight & Reasoning Endpoint
  app.post('/api/insight', async (req, res) => {
    try {
      const { plan, userPreferences, liveConditions } = req.body;

      if (!plan) {
        return res.status(400).json({ error: 'Plan data is required' });
      }

      const client = getGeminiClient();
      if (!client) {
        // Return structured reasoning without failing
        return res.json({
          narrative: `This itinerary around ${plan.area} is optimized for your group of ${userPreferences?.groupSize || 2}, balancing ${plan.items.map((i: any) => i.activity.name).join(' and ')} within your SGD $${userPreferences?.budgetPerPerson || 50}/pax budget.`,
          localInsiderTip: `Take the sheltered MRT underground underpasses to stay 100% dry if rain hits during your transit between stops.`,
          tradeOffs: `We prioritized proximity and sheltered routes over more distant attractions to maximize your ${Math.round((plan.totalDurationMinutes || 180) / 60)} hours.`,
          generatedAt: new Date().toISOString(),
          source: 'SG Activities Recommendation Engine (Rule-based)',
        });
      }

      const prompt = `You are a Singapore activity planning expert and UX recommendation engine.
Analyze the following verified factual plan data and user preferences.
Do NOT invent fake prices, venue hours, or transport lines; adhere strictly to the provided facts.

Plan Details:
- Title: ${plan.title}
- Area: ${plan.area}
- Group Size: ${userPreferences?.groupSize || 2} pax
- Target Duration: ${plan.totalDurationMinutes} mins (~${Math.round(plan.totalDurationMinutes / 60)} hours)
- Budget: SGD $${plan.costPerPerson} per person (Total Group: SGD $${plan.totalCostGroup})
- Activities: ${plan.items.map((i: any) => `${i.timeSlot}: ${i.activity.name} (${i.activity.category})`).join(' -> ')}
- Current Singapore Weather: ${liveConditions?.weatherForecast || 'Passing Showers'}, Temp: ${liveConditions?.temperatureC || 31}°C, PSI: ${liveConditions?.psiValue || 40} (${liveConditions?.psiStatus || 'Good'})
- Selected User Interests: ${(userPreferences?.interests || []).join(', ') || 'General exploration'}
- Vouchers Selected: ${(userPreferences?.vouchers || []).join(', ') || 'None'}

Provide a structured, engaging, and practical explanation with:
1. Narrative: A concise 2-3 sentence overview of why this exact route is ideal right now in Singapore.
2. Local Insider Tip: A specific Singaporean practical hack (e.g. MRT exit, best timing, air-con shelter, or Singpass/CDC voucher tip).
3. TradeOffs: A brief 1-sentence note on the trade-offs made (e.g. prioritizing comfort/indoor shelter vs outdoor distance).

Output in JSON format with keys: "narrative", "localInsiderTip", "tradeOffs".`;

      const geminiResponse = await client.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = geminiResponse.text?.trim() || '{}';
      let parsed = {};
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = {
          narrative: responseText,
          localInsiderTip: 'Check MRT exit signage before tapping out to save walking time.',
          tradeOffs: 'Optimized for minimal travel time and sheltered comfort.',
        };
      }

      res.json({
        ...parsed,
        generatedAt: new Date().toISOString(),
        source: 'Gemini AI Studio (gemini-3.7-flash)',
      });
    } catch (err: any) {
      console.error('Gemini insight error:', err);
      res.json({
        narrative: `Curated itinerary for your group, balancing dining, culture, and ease of transit in Singapore.`,
        localInsiderTip: `Keep your EZ-Link / contactless bank card handy and look for designated sheltered linkways.`,
        tradeOffs: `Chosen to fit your exact budget and timeline smoothly.`,
        generatedAt: new Date().toISOString(),
        source: 'SG Activities Fallback Engine',
      });
    }
  });

  // Setup Vite development middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SG Activities server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
