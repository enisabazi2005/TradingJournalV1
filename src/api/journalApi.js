const API_URL = 'http://127.0.0.1:8000/api'

export async function getJournal(params = {}) {
    const query = new URLSearchParams()

    if (params.from) {
        query.append('from', params.from)
    }

    if (params.to) {
        query.append('to', params.to)
    }

    const url = query.toString()
        ? `${API_URL}/journal?${query.toString()}`
        : `${API_URL}/journal`

    const response = await fetch(url, {
        headers: {
            Accept: 'application/json',
        },
    })

    if (!response.ok) {
        throw new Error(
            `Failed to load journal: ${response.status}`
        )
    }

    return response.json()
}