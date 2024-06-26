import { logError } from './log'

export const tryParse = (str) => {
    try {
        return JSON.parse(str)
    } catch (err) {
        logError(err)
        return null
    }
}
