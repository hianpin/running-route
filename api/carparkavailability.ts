import type { Request, Response } from 'express';
import { applyCorsHeaders, getAccountKey } from './_helper';

export default async function handler(req: Request, res: Response) {
  if (applyCorsHeaders(req, res)) return;

  const accountKey = getAccountKey(req);

  // If no AccountKey is configured yet, return a clean payload explaining how to configure it
  // along with Singapore runner carpark schema reference
  if (!accountKey) {
    res.status(200).json({
      status: 'pending_key',
      message:
        'AccountKey header not provided. Set ACCOUNT_KEY in environment variables or send header AccountKey: <your_key>.',
      sampleRunnerCarparks: [
        {
          CarParkID: 'ECP-B1',
          Area: 'East Coast Park',
          Development: 'Parkland Green Carpark B1',
          Location: '1.3006 103.9085',
          AvailableLots: 142,
          LotType: 'C',
          Agency: 'NParks',
        },
        {
          CarParkID: 'MAC-01',
          Area: 'MacRitchie Reservoir',
          Development: 'MacRitchie Amenities Centre Carpark',
          Location: '1.3418 103.8345',
          AvailableLots: 48,
          LotType: 'C',
          Agency: 'NParks',
        },
        {
          CarParkID: 'MBS-01',
          Area: 'Marina Bay',
          Development: 'Marina Bay Sands South Carpark',
          Location: '1.2834 103.8585',
          AvailableLots: 310,
          LotType: 'C',
          Agency: 'Commercial',
        },
        {
          CarParkID: 'BISHAN-02',
          Area: 'Bishan Park',
          Development: 'Bishan-Ang Mo Kio Park Carpark A',
          Location: '1.3618 103.8465',
          AvailableLots: 85,
          LotType: 'C',
          Agency: 'NParks',
        },
      ],
    });
    return;
  }

  try {
    const headers: Record<string, string> = {
      AccountKey: accountKey,
      accept: 'application/json',
    };

    // Official LTA DataMall CarPark Availability endpoint
    const url = 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2';
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      res.status(response.status).json({
        error: `CarPark API returned HTTP ${response.status}`,
        details: errorText,
      });
      return;
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error: any) {
    console.error('Error fetching carpark availability:', error);
    res.status(500).json({
      error: 'Failed to fetch carpark availability data',
      message: error?.message || 'Internal connection error',
    });
  }
}
