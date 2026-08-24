const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyGDChcd1yll1WHFyJA5iYoUGl5qfRkhHbJ7-udM784iKq7a45sNphJuhGypAH7P17_/exec'

export type AppsScriptApplicationPayload = {
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

export async function syncApplicationToGoogleSheet(payload: AppsScriptApplicationPayload) {
  try {
    console.info('[google-apps-script] sending payload', {
      url: GOOGLE_APPS_SCRIPT_URL,
      payload,
    })

    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const responseBody = await response.text()

    console.info('[google-apps-script] response', {
      status: response.status,
      statusText: response.statusText,
      body: responseBody,
    })

    if (!response.ok) {
      throw new Error(`Apps Script request failed: ${response.status} ${response.statusText} ${responseBody}`)
    }

    return { ok: true, sent: true }
  } catch (error) {
    console.error('[google-apps-script] sync failed', {
      error: error instanceof Error ? error.stack || error.message : String(error),
    })

    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}
