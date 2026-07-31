const DEFAULT_MAPLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzneGOHENQgPhxyILvYH-oqg7BgEfZJT9oxf6BLq3UM0SaRE2NOSOv4YST3ZsgxlEBZ6w/exec'

type MapleApplicationSyncPayload = {
  applicationId: string
  appliedDate: string
  name: string
  email: string
  phone: string
  job: string
  company: string
  resume: string
  linkedin: string
  portfolio: string
  experience: string
  location: string
}

export async function syncMapleApplicationToGoogleSheet(payload: MapleApplicationSyncPayload) {
  const webhookUrl = process.env.MAPLE_GOOGLE_SHEET_WEBHOOK?.trim() || DEFAULT_MAPLE_APPS_SCRIPT_URL

  const normalizedPayload = {
    applicationId: payload.applicationId || '',
    appliedDate: payload.appliedDate || '',
    name: payload.name || '',
    email: payload.email || '',
    phone: payload.phone || '',
    job: payload.job || '',
    company: payload.company || '',
    resume: payload.resume || '',
    portfolio: payload.portfolio || '',
    linkedin: payload.linkedin || '',
    experience: payload.experience || '',
    location: payload.location || '',
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(normalizedPayload),
    })

    const responseText = await response.text()

    if (!response.ok) {
      console.error('[maple-google-sheet] sync request failed', {
        status: response.status,
        body: responseText,
      })
    }

    return {
      success: response.ok,
      status: response.status,
      responseText,
    }
  } catch (error) {
    console.error('[maple-google-sheet] sync failed', {
      error: error instanceof Error ? error.message : String(error),
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
