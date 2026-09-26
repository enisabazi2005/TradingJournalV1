const API_URL = 'http://127.0.0.1:8000/api'


function getNetProfit(trade) {
    return (
        Number(trade.profit || 0) +
        Number(trade.commission || 0) +
        Number(trade.swap || 0)
    )
}


function calculateTradeStats(trades = []) {
    const total = trades.length

    const wins = trades.filter(
        trade => getNetProfit(trade) > 0
    ).length

    const losses = trades.filter(
        trade => getNetProfit(trade) < 0
    ).length

    const breakeven = trades.filter(
        trade => getNetProfit(trade) === 0
    ).length

    const winRate = total > 0
        ? (wins / total) * 100
        : 0

    const netProfit = trades.reduce(
        (totalProfit, trade) => {
            return totalProfit + getNetProfit(trade)
        },
        0
    )

    return {
        total,
        wins,
        losses,
        breakeven,
        winRate,
        netProfit,
    }
}


function calculateMonthlyStats(trades = []) {
    const currentYear = new Date().getFullYear()

    return Array.from({ length: 12 }, (_, monthIndex) => {
        const monthTrades = trades.filter(trade => {
            const date = new Date(trade.opened_at)

            return (
                date.getFullYear() === currentYear &&
                date.getMonth() === monthIndex
            )
        })

        return {
            monthIndex,
            month: new Date(
                currentYear,
                monthIndex,
                1
            ).toLocaleString('en-US', {
                month: 'long',
            }),

            year: currentYear,

            ...calculateTradeStats(monthTrades),
        }
    })
}


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

    const data = await response.json()

    const trades = data.trades || []

    const overallStats = calculateTradeStats(trades)

    const now = new Date()

    const currentMonthTrades = trades.filter(trade => {
        const tradeDate = new Date(trade.opened_at)

        return (
            tradeDate.getFullYear() === now.getFullYear() &&
            tradeDate.getMonth() === now.getMonth()
        )
    })

    const currentMonthStats = calculateTradeStats(
        currentMonthTrades
    )

    const monthlyStats = calculateMonthlyStats(trades)

    return {
        ...data,

        stats: {
            overall: overallStats,

            currentMonth: {
                month: now.toLocaleString('en-US', {
                    month: 'long',
                }),

                year: now.getFullYear(),

                ...currentMonthStats,
            },

            months: monthlyStats,
        },
    }
}

// Add these two functions to your existing api file (the one with
// API_URL and getJournal). They're used by DailyPanel.vue to save
// and delete a trade's screenshot note.

export async function updateTradeNote(tradeId, note) {
    const response = await fetch(`${API_URL}/trades/${tradeId}/note`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({ note }),
    })

    if (!response.ok) {
        throw new Error(
            `Failed to save trade note: ${response.status}`
        )
    }

    return response.json()
}

export async function deleteTradeNote(tradeId) {
    const response = await fetch(`${API_URL}/trades/${tradeId}/note`, {
        method: 'DELETE',
        headers: {
            Accept: 'application/json',
        },
    })

    if (!response.ok) {
        throw new Error(
            `Failed to delete trade note: ${response.status}`
        )
    }

    return response.json()
}