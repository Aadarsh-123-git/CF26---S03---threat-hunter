import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveWeather } from '@/lib/weather/open-meteo';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') || '37.7680');
  const lon = parseFloat(searchParams.get('lon') || '-122.4150');
  const city = searchParams.get('city') || 'San Francisco';

  const weather = await fetchLiveWeather(lat, lon, city);
  return NextResponse.json(weather);
}
