export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.TRACCAR_URL;
  const email = process.env.TRACCAR_EMAIL;
  const password = process.env.TRACCAR_PASSWORD;

  if (!url || !email || !password) {
    return Response.json({ configured: false, devices: [] });
  }

  const auth = Buffer.from(`${email}:${password}`).toString('base64');
  const headers = {
    Authorization: `Basic ${auth}`,
    Accept: 'application/json',
  };

  try {
    const [devicesRes, positionsRes] = await Promise.all([
      fetch(`${url}/api/devices`, { headers, cache: 'no-store' }),
      fetch(`${url}/api/positions`, { headers, cache: 'no-store' }),
    ]);

    if (!devicesRes.ok || !positionsRes.ok) {
      return Response.json(
        {
          configured: true,
          error: `Traccar injoignable — devices:${devicesRes.status} positions:${positionsRes.status}`,
          devices: [],
        },
        { status: 502 }
      );
    }

    const devices = await devicesRes.json();
    const positions = await positionsRes.json();

    const merged = devices.map((d) => {
      const pos = positions.find((p) => p.deviceId === d.id);
      return {
        uniqueId: d.uniqueId,
        name: d.name,
        status: d.status,
        lastUpdate: d.lastUpdate,
        latitude: pos ? pos.latitude : null,
        longitude: pos ? pos.longitude : null,
        speed: pos ? pos.speed : null,
        fixTime: pos ? pos.fixTime : null,
      };
    });

    const debugLine =
      `DEBUG — ${devices.length} appareil(s), ${positions.length} position(s). ` +
      devices
        .map(
          (d) =>
            `[${d.uniqueId}] status=${d.status} positionId=${d.positionId ?? 'aucun'} lastUpdate=${d.lastUpdate ?? 'jamais'}`
        )
        .join(' | ');

    return Response.json({ configured: true, devices: merged, error: debugLine });
  } catch (e) {
    return Response.json({ configured: true, error: 'DEBUG exception: ' + e.message, devices: [] }, { status: 502 });
  }
}
