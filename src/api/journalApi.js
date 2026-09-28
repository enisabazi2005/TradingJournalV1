const API_URL = 'http://127.0.0.1:8000/api'

// A trade whose net P/L falls within this band (either side of zero)
// is treated as breakeven — it's excluded from win/loss and from the
// win-rate calculation entirely.
const BREAKEVEN_THRESHOLD = 10


function getNetProfit(trade) {
    return (
        Number(trade.profit || 0) +
        Number(trade.commission || 0) +
        Number(trade.swap || 0)
    )
}


/**
 * Whether a raw dollar amount (a trade's net P/L, or a day's total
 * P/L) falls inside the breakeven band around zero.
 */
export function isBreakevenAmount(amount, threshold = BREAKEVEN_THRESHOLD) {
    return Math.abs(Number(amount) || 0) <= threshold
}


/**
 * Classifies a trade's outcome as 'win', 'loss', or 'breakeven'.
 * Exported so the frontend can reuse the exact same rule for styling.
 */
export function classifyTrade(trade, threshold = BREAKEVEN_THRESHOLD) {
    const net = getNetProfit(trade)

    if (isBreakevenAmount(net, threshold)) {
        return 'breakeven'
    }

    return net > 0 ? 'win' : 'loss'
}


export function isBreakevenTrade(trade, threshold = BREAKEVEN_THRESHOLD) {
    return classifyTrade(trade, threshold) === 'breakeven'
}


function calculateTradeStats(trades = []) {
    const total = trades.length

    let wins = 0
    let losses = 0
    let breakeven = 0

    for (const trade of trades) {
        const outcome = classifyTrade(trade)

        if (outcome === 'win') {
            wins++
        } else if (outcome === 'loss') {
            losses++
        } else {
            breakeven++
        }
    }

    // Win rate is only meaningful over trades that actually won or
    // lost — breakeven trades are excluded from both sides of it.
    const decisive = wins + losses

    const winRate = decisive > 0
        ? (wins / decisive) * 100
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